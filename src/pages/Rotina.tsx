import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

/* ---------------------------------------------------------------
   Tipos e constantes
--------------------------------------------------------------- */

type DiaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'
type CategoriaKey = 'trabalho' | 'trading' | 'corpo' | 'pessoal' | 'estudo'

type Bloco = {
  id: string
  inicio: string // "08:00"
  fim: string    // "09:00"
  titulo: string
  categoria: CategoriaKey
}

type Rotina = Record<DiaKey, Bloco[]>

const DIAS: { key: DiaKey; curto: string; longo: string }[] = [
  { key: 'seg', curto: 'Seg', longo: 'Segunda' },
  { key: 'ter', curto: 'Ter', longo: 'Terça' },
  { key: 'qua', curto: 'Qua', longo: 'Quarta' },
  { key: 'qui', curto: 'Qui', longo: 'Quinta' },
  { key: 'sex', curto: 'Sex', longo: 'Sexta' },
  { key: 'sab', curto: 'Sáb', longo: 'Sábado' },
  { key: 'dom', curto: 'Dom', longo: 'Domingo' },
]

const CATEGORIAS: Record<CategoriaKey, { nome: string; cor: string; fundo: string }> = {
  trabalho: { nome: 'Medicina S/A', cor: '#60a5fa', fundo: 'rgba(96,165,250,0.12)' },
  trading: { nome: 'Trading', cor: '#34d399', fundo: 'rgba(52,211,153,0.12)' },
  corpo: { nome: 'Corpo', cor: '#f472b6', fundo: 'rgba(244,114,182,0.12)' },
  pessoal: { nome: 'Pessoal', cor: '#a78bfa', fundo: 'rgba(167,139,250,0.12)' },
  estudo: { nome: 'Estudo', cor: '#94a3b8', fundo: 'rgba(148,163,184,0.12)' },
}

const ROTINA_VAZIA: Rotina = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }

// Ponto de partida: dias úteis no formato que você descreveu.
// É só editar ou apagar direto na tela.
const MODELO_UTIL: Omit<Bloco, 'id'>[] = [
  { inicio: '08:00', fim: '09:00', titulo: 'Acordar e começar o dia', categoria: 'pessoal' },
  { inicio: '09:00', fim: '12:00', titulo: 'Medicina S/A', categoria: 'trabalho' },
  { inicio: '12:00', fim: '13:00', titulo: 'Almoço', categoria: 'corpo' },
  { inicio: '13:00', fim: '16:00', titulo: 'Medicina S/A', categoria: 'trabalho' },
  { inicio: '16:00', fim: '17:00', titulo: 'Trading', categoria: 'trading' },
  { inicio: '17:00', fim: '18:30', titulo: 'Academia', categoria: 'corpo' },
]

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */

const novoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const emMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const duracao = (b: Bloco) => Math.max(0, emMinutos(b.fim) - emMinutos(b.inicio))

const formatarDuracao = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`
  if (h) return `${h}h`
  return `${m}min`
}

const ordenar = (blocos: Bloco[]) =>
  [...blocos].sort((a, b) => emMinutos(a.inicio) - emMinutos(b.inicio))

const diaDeHoje = (): DiaKey =>
  (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as DiaKey[])[new Date().getDay()]

const modeloComIds = (): Rotina => {
  const gerar = () => MODELO_UTIL.map((b) => ({ ...b, id: novoId() }))
  return { ...ROTINA_VAZIA, seg: gerar(), ter: gerar(), qua: gerar(), qui: gerar(), sex: gerar() }
}

/* ---------------------------------------------------------------
   Estilos base
--------------------------------------------------------------- */

const cardBase: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
}

const botaoPrimario: React.CSSProperties = {
  background: 'var(--amber-dim)',
  border: '1px solid var(--amber-border)',
  color: 'var(--amber)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 16px',
  fontSize: '0.88rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const botaoSecundario: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-2)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 16px',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const campo: React.CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'inherit',
  fontSize: '1rem',
  fontFamily: 'inherit',
  colorScheme: 'dark', // se seu tema for claro, apague esta linha
}

/* ---------------------------------------------------------------
   Página
--------------------------------------------------------------- */

export default function Rotina() {
  const { user } = useAuth()

  const [rotina, setRotina] = useState<Rotina>(ROTINA_VAZIA)
  const [dia, setDia] = useState<DiaKey>(diaDeHoje())
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [editando, setEditando] = useState<Bloco | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [copiaAberta, setCopiaAberta] = useState(false)

  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'rotinas', user.uid))
        if (!ativo) return
        if (snap.exists()) setRotina({ ...ROTINA_VAZIA, ...(snap.data().dias as Rotina) })
        else setRotina(modeloComIds())
      } catch {
        if (ativo) setErro('Não foi possível carregar a rotina. Verifique a conexão e recarregue.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [user])

  async function persistir(nova: Rotina) {
    setRotina(nova)
    if (!user) return
    setSalvando(true)
    setErro(null)
    try {
      await setDoc(doc(db, 'rotinas', user.uid), { dias: nova, atualizadoEm: Date.now() })
    } catch {
      setErro('A última alteração não foi salva. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const blocos = useMemo(() => ordenar(rotina[dia] ?? []), [rotina, dia])

  const totais = useMemo(() => {
    const acc: Partial<Record<CategoriaKey, number>> = {}
    blocos.forEach((b) => {
      acc[b.categoria] = (acc[b.categoria] ?? 0) + duracao(b)
    })
    return Object.entries(acc).sort((a, b) => b[1] - a[1]) as [CategoriaKey, number][]
  }, [blocos])

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()
  const ehHoje = dia === diaDeHoje()

  function salvarBloco(b: Bloco) {
    const lista = rotina[dia].some((x) => x.id === b.id)
      ? rotina[dia].map((x) => (x.id === b.id ? b : x))
      : [...rotina[dia], b]
    persistir({ ...rotina, [dia]: ordenar(lista) })
    setFormAberto(false)
    setEditando(null)
  }

  function removerBloco(id: string) {
    persistir({ ...rotina, [dia]: rotina[dia].filter((b) => b.id !== id) })
    setFormAberto(false)
    setEditando(null)
  }

  function copiarPara(destino: DiaKey) {
    const copia = rotina[dia].map((b) => ({ ...b, id: novoId() }))
    persistir({ ...rotina, [destino]: copia })
    setCopiaAberta(false)
    setDia(destino)
  }

  if (carregando) {
    return (
      <div style={{ padding: 24, color: 'var(--text-2)', fontSize: '0.9rem' }}>
        Carregando sua rotina…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 80px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Rotina
        </h1>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
          {salvando ? 'Salvando…' : 'Tudo salvo'}
        </span>
      </header>

      {erro && (
        <p
          style={{
            ...cardBase,
            borderColor: 'rgba(248,113,113,0.4)',
            background: 'rgba(248,113,113,0.1)',
            color: '#f87171',
            padding: '10px 12px',
            fontSize: '0.85rem',
            marginBottom: 16,
          }}
        >
          {erro}
        </p>
      )}

      {/* Seletor de dia */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 20,
        }}
      >
        {DIAS.map((d) => {
          const ativo = d.key === dia
          const hoje = d.key === diaDeHoje()
          return (
            <button
              key={d.key}
              onClick={() => setDia(d.key)}
              style={{
                flex: 1,
                minWidth: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                background: ativo ? 'var(--amber-dim)' : 'transparent',
                border: `1px solid ${ativo ? 'var(--amber-border)' : 'var(--border)'}`,
                color: ativo ? 'var(--amber)' : 'var(--text-2)',
                fontWeight: ativo ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {d.curto}
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: hoje ? (ativo ? 'var(--amber)' : 'var(--text-2)') : 'transparent',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Resumo do dia */}
      {totais.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {totais.map(([cat, min]) => (
            <span
              key={cat}
              style={{
                background: CATEGORIAS[cat].fundo,
                color: CATEGORIAS[cat].cor,
                border: `1px solid ${CATEGORIAS[cat].fundo}`,
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: '0.75rem',
              }}
            >
              {CATEGORIAS[cat].nome} · {formatarDuracao(min)}
            </span>
          ))}
        </div>
      )}

      {/* Lista de blocos */}
      {blocos.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '40px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', margin: 0 }}>
            {DIAS.find((d) => d.key === dia)?.longo} ainda está livre.
          </p>
          <button
            style={{ ...botaoPrimario, marginTop: 16 }}
            onClick={() => {
              setEditando(null)
              setFormAberto(true)
            }}
          >
            Adicionar o primeiro bloco
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocos.map((b, i) => {
            const anterior = blocos[i - 1]
            const conflito = anterior && emMinutos(anterior.fim) > emMinutos(b.inicio)
            const emAndamento =
              ehHoje && minutosAgora >= emMinutos(b.inicio) && minutosAgora < emMinutos(b.fim)

            return (
              <button
                key={b.id}
                onClick={() => {
                  setEditando(b)
                  setFormAberto(true)
                }}
                style={{
                  ...cardBase,
                  borderColor: emAndamento ? 'var(--amber-border)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 12,
                  padding: 12,
                  textAlign: 'left',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    width: 3,
                    flexShrink: 0,
                    borderRadius: 999,
                    background: CATEGORIAS[b.categoria].cor,
                  }}
                />
                <span
                  style={{
                    width: 52,
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    color: 'var(--text-2)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.5,
                  }}
                >
                  {b.inicio}
                  <br />
                  {b.fim}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.titulo}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 3,
                      fontSize: '0.75rem',
                      color: emAndamento ? 'var(--amber)' : 'var(--text-2)',
                    }}
                  >
                    {CATEGORIAS[b.categoria].nome} · {formatarDuracao(duracao(b))}
                    {emAndamento && ' · agora'}
                    {conflito && ' · choca com o bloco anterior'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Ações */}
      {blocos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          <button
            style={botaoPrimario}
            onClick={() => {
              setEditando(null)
              setFormAberto(true)
            }}
          >
            Adicionar bloco
          </button>
          <button style={botaoSecundario} onClick={() => setCopiaAberta((v) => !v)}>
            Copiar este dia
          </button>
        </div>
      )}

      {copiaAberta && (
        <div style={{ ...cardBase, padding: 12, marginTop: 12 }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-2)' }}>
            Copiar {DIAS.find((d) => d.key === dia)?.longo} para qual dia? O conteúdo do destino é
            substituído.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DIAS.filter((d) => d.key !== dia).map((d) => (
              <button
                key={d.key}
                onClick={() => copiarPara(d.key)}
                style={{ ...botaoSecundario, padding: '6px 12px' }}
              >
                {d.curto}
              </button>
            ))}
          </div>
        </div>
      )}

      {formAberto && (
        <FormBloco
          bloco={editando}
          onSalvar={salvarBloco}
          onRemover={removerBloco}
          onFechar={() => {
            setFormAberto(false)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------
   Formulário
--------------------------------------------------------------- */

function FormBloco({
  bloco,
  onSalvar,
  onRemover,
  onFechar,
}: {
  bloco: Bloco | null
  onSalvar: (b: Bloco) => void
  onRemover: (id: string) => void
  onFechar: () => void
}) {
  const [inicio, setInicio] = useState(bloco?.inicio ?? '09:00')
  const [fim, setFim] = useState(bloco?.fim ?? '10:00')
  const [titulo, setTitulo] = useState(bloco?.titulo ?? '')
  const [categoria, setCategoria] = useState<CategoriaKey>(bloco?.categoria ?? 'trabalho')

  const horarioInvalido = emMinutos(fim) <= emMinutos(inicio)
  const invalido = !titulo.trim() || horarioInvalido

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          background: 'var(--bg-2)',
          borderTop: '1px solid var(--border)',
          borderRadius: '16px 16px 0 0',
          padding: '20px 16px 32px',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700 }}>
          {bloco ? 'Editar bloco' : 'Novo bloco'}
        </h2>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            Começa
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              style={campo}
            />
          </label>
          <label style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            Termina
            <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} style={campo} />
          </label>
        </div>

        <label
          style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}
        >
          O que é
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Medicina S/A, academia, almoço"
            style={campo}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {(Object.keys(CATEGORIAS) as CategoriaKey[]).map((c) => {
            const ativo = categoria === c
            return (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                style={{
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: ativo ? CATEGORIAS[c].fundo : 'transparent',
                  border: `1px solid ${ativo ? CATEGORIAS[c].cor : 'var(--border)'}`,
                  color: ativo ? CATEGORIAS[c].cor : 'var(--text-2)',
                }}
              >
                {CATEGORIAS[c].nome}
              </button>
            )
          })}
        </div>

        {horarioInvalido && (
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#f87171' }}>
            O fim precisa ser depois do começo.
          </p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={invalido}
            onClick={() =>
              onSalvar({ id: bloco?.id ?? novoId(), inicio, fim, titulo: titulo.trim(), categoria })
            }
            style={{ ...botaoPrimario, flex: 1, opacity: invalido ? 0.4 : 1 }}
          >
            Salvar bloco
          </button>
          {bloco && (
            <button
              onClick={() => onRemover(bloco.id)}
              style={{ ...botaoSecundario, borderColor: 'rgba(248,113,113,0.4)', color: '#f87171' }}
            >
              Excluir
            </button>
          )}
          <button onClick={onFechar} style={{ ...botaoSecundario, border: '1px solid transparent' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
