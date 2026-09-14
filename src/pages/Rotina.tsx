import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

/* ---------------------------------------------------------------
   Tipos e constantes
--------------------------------------------------------------- */

type DiaKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

type Bloco = {
  id: string
  inicio: string // "08:00"
  fim: string    // "09:00" — se for menor que o início, termina no dia seguinte
  titulo: string
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

const ROTINA_VAZIA: Rotina = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }

const DIA_EM_MIN = 24 * 60

/* ---------------------------------------------------------------
   Helpers de horário
--------------------------------------------------------------- */

const novoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const emMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const deMinutos = (min: number) => {
  const total = ((min % DIA_EM_MIN) + DIA_EM_MIN) % DIA_EM_MIN
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// true quando o bloco atravessa a meia-noite (ex.: 23:30 → 09:00)
const viraODia = (b: Bloco) => emMinutos(b.fim) < emMinutos(b.inicio)

const duracao = (b: Bloco) => {
  const i = emMinutos(b.inicio)
  const f = emMinutos(b.fim)
  return f >= i ? f - i : DIA_EM_MIN - i + f
}

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

/* ---------------------------------------------------------------
   Importação por texto

   Entende linhas como:
     08:00                        Acordar
     08:00–09:00  | Café + higiene + rotina matinal
     **09:00-10:00** 📈 Trading — estudo/análise
     17:00 em diante   Academia / futebol
     23:30–07:00   Dormir
   Linhas sem horário (títulos, cabeçalho de tabela) são ignoradas.
--------------------------------------------------------------- */

const RE_HORA = /(\d{1,2})\s*[:h]\s*(\d{2})/g

function limparTitulo(txt: string) {
  return txt
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/^\s*(em diante|em frente|adiante)\b/i, '')
    .replace(/^[\s|:•·\-–—>~]+/, '')
    .replace(/[\s|]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseRotinaTexto(texto: string): Bloco[] {
  const brutos: { inicio: string; fim?: string; titulo: string }[] = []

  for (const original of texto.split('\n')) {
    let linha = original.replace(/[*_`]/g, '').trim()
    if (!linha) continue
    linha = linha.replace(/^\|/, '').replace(/\|$/, '').trim()
    if (/^[-|\s:]+$/.test(linha)) continue // linha separadora de tabela

    RE_HORA.lastIndex = 0
    const achados = [...linha.matchAll(RE_HORA)]
    if (achados.length === 0) continue

    const primeiro = achados[0]
    const inicioIdx = primeiro.index ?? 0
    const inicio = deMinutos(Number(primeiro[1]) * 60 + Number(primeiro[2]))

    let corte = inicioIdx + primeiro[0].length
    let fim: string | undefined

    const segundo = achados[1]
    if (segundo && (segundo.index ?? 0) - corte <= 6) {
      fim = deMinutos(Number(segundo[1]) * 60 + Number(segundo[2]))
      corte = (segundo.index ?? 0) + segundo[0].length
    }

    let titulo = limparTitulo(linha.slice(corte))
    if (!titulo) titulo = limparTitulo(linha.slice(0, inicioIdx))
    if (!titulo) continue

    brutos.push({ inicio, fim, titulo })
  }

  const ordenados = brutos.sort((a, b) => emMinutos(a.inicio) - emMinutos(b.inicio))

  return ordenados.map((b, i) => {
    let fim = b.fim
    if (!fim) {
      const seguinte = ordenados.slice(i + 1).find((x) => emMinutos(x.inicio) > emMinutos(b.inicio))
      fim = seguinte ? seguinte.inicio : deMinutos(emMinutos(b.inicio) + 60)
    }
    if (fim === b.inicio) fim = deMinutos(emMinutos(b.inicio) + 60)
    return { id: novoId(), inicio: b.inicio, fim, titulo: b.titulo }
  })
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
  colorScheme: 'dark',
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
}

const painel: React.CSSProperties = {
  width: '100%',
  maxWidth: 760,
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--bg-2)',
  borderTop: '1px solid var(--border)',
  borderRadius: '16px 16px 0 0',
  padding: '20px 16px 32px',
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
  const [importAberto, setImportAberto] = useState(false)
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
  const totalDia = useMemo(() => blocos.reduce((acc, b) => acc + duracao(b), 0), [blocos])

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

  function aplicarImportacao(blocosNovos: Bloco[], dias: DiaKey[]) {
    const nova = { ...rotina }
    dias.forEach((d) => {
      nova[d] = blocosNovos.map((b) => ({ ...b, id: novoId() }))
    })
    persistir(nova)
    setImportAberto(false)
    if (dias.length && !dias.includes(dia)) setDia(dias[0])
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
            borderColor: 'rgba(224,82,82,0.35)',
            background: 'var(--red-dim)',
            color: 'var(--red)',
            padding: '10px 12px',
            fontSize: '0.85rem',
            marginBottom: 16,
          }}
        >
          {erro}
        </p>
      )}

      {/* Seletor de dia */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
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

      {blocos.length > 0 && (
        <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--text-2)' }}>
          {blocos.length} blocos · {formatarDuracao(totalDia)} planejadas
        </p>
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
          <div
            style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}
          >
            <button
              style={botaoPrimario}
              onClick={() => {
                setEditando(null)
                setFormAberto(true)
              }}
            >
              Adicionar bloco
            </button>
            <button style={botaoSecundario} onClick={() => setImportAberto(true)}>
              Colar rotina em texto
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocos.map((b, i) => {
            const anterior = blocos[i - 1]
            // um bloco que vira o dia nunca "choca" com o seguinte
            const conflito =
              anterior && !viraODia(anterior) && emMinutos(anterior.fim) > emMinutos(b.inicio)

            const inicioMin = emMinutos(b.inicio)
            const fimMin = emMinutos(b.fim)
            const emAndamento =
              ehHoje &&
              (viraODia(b)
                ? minutosAgora >= inicioMin || minutosAgora < fimMin
                : minutosAgora >= inicioMin && minutosAgora < fimMin)

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
                  background: emAndamento ? 'var(--amber-dim)' : 'var(--bg-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  textAlign: 'left',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    width: 52,
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    color: emAndamento ? 'var(--amber)' : 'var(--text-2)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.5,
                  }}
                >
                  {b.inicio}
                  <br />
                  {b.fim}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem' }}>
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
                    {formatarDuracao(duracao(b))}
                    {viraODia(b) && ' · termina no dia seguinte'}
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
          <button style={botaoSecundario} onClick={() => setImportAberto(true)}>
            Colar rotina em texto
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

      {importAberto && (
        <ImportarTexto
          diaAtual={dia}
          onAplicar={aplicarImportacao}
          onFechar={() => setImportAberto(false)}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------
   Formulário de bloco
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

  const mesmoHorario = emMinutos(fim) === emMinutos(inicio)
  const atravessaMeiaNoite = emMinutos(fim) < emMinutos(inicio)
  const invalido = !titulo.trim() || mesmoHorario

  const previa = { id: 'previa', inicio, fim, titulo } as Bloco

  return (
    <div onClick={onFechar} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={painel}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700 }}>
          {bloco ? 'Editar bloco' : 'Novo bloco'}
        </h2>

        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <label style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            Começa
            <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} style={campo} />
          </label>
          <label style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-2)' }}>
            Termina
            <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} style={campo} />
          </label>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: 'var(--text-2)' }}>
          {mesmoHorario
            ? 'Começo e fim iguais — ajuste um dos dois.'
            : atravessaMeiaNoite
              ? `Termina no dia seguinte · ${formatarDuracao(duracao(previa))}`
              : formatarDuracao(duracao(previa))}
        </p>

        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 20 }}>
          O que é
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Medicina S/A, academia, dormir"
            style={campo}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={invalido}
            onClick={() => onSalvar({ id: bloco?.id ?? novoId(), inicio, fim, titulo: titulo.trim() })}
            style={{ ...botaoPrimario, flex: 1, opacity: invalido ? 0.4 : 1 }}
          >
            Salvar bloco
          </button>
          {bloco && (
            <button
              onClick={() => onRemover(bloco.id)}
              style={{ ...botaoSecundario, borderColor: 'rgba(224,82,82,0.35)', color: 'var(--red)' }}
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

/* ---------------------------------------------------------------
   Importar rotina em texto
--------------------------------------------------------------- */

const EXEMPLO_TEXTO = `08:00 Acordar
08:00–09:00 Café + higiene + rotina matinal
09:00–10:00 Trading — estudo/análise
10:00–12:30 Medicina S/A
12:30–13:30 Almoço + descanso
13:30–16:00 Medicina S/A
16:00–17:00 Trading
17:00 em diante Academia / futebol / vida pessoal
20:00–21:30 Trading — estudo/backtest
21:30–23:30 Desacelerar
23:30–08:00 Dormir`

function ImportarTexto({
  diaAtual,
  onAplicar,
  onFechar,
}: {
  diaAtual: DiaKey
  onAplicar: (blocos: Bloco[], dias: DiaKey[]) => void
  onFechar: () => void
}) {
  const [texto, setTexto] = useState('')
  const [destinos, setDestinos] = useState<DiaKey[]>([diaAtual])

  const blocos = useMemo(() => parseRotinaTexto(texto), [texto])

  function alternarDia(d: DiaKey) {
    setDestinos((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d]))
  }

  return (
    <div onClick={onFechar} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={painel}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>Colar rotina em texto</h2>
        <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
          Uma linha por bloco, começando pelo horário. Aceita 08:00, 08:00–09:00 e "17:00 em diante".
          Linhas sem horário são ignoradas.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={9}
          placeholder={EXEMPLO_TEXTO}
          style={{ ...campo, marginTop: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem' }}
        />

        <button
          onClick={() => setTexto(EXEMPLO_TEXTO)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: 8,
            color: 'var(--amber)',
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Usar o exemplo acima
        </button>

        {texto.trim() && (
          <div style={{ ...cardBase, padding: 12, marginTop: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-2)' }}>
              {blocos.length === 0
                ? 'Nenhum horário reconhecido. Confira se cada linha começa com um horário.'
                : `${blocos.length} blocos reconhecidos:`}
            </p>
            {blocos.map((b) => (
              <div key={b.id} style={{ fontSize: '0.8rem', padding: '3px 0', display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {b.inicio}–{b.fim}
                </span>
                <span>{b.titulo}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '18px 0 8px', fontSize: '0.8rem', color: 'var(--text-2)' }}>
          Aplicar em quais dias? O conteúdo atual desses dias é substituído.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {DIAS.map((d) => {
            const ativo = destinos.includes(d.key)
            return (
              <button
                key={d.key}
                onClick={() => alternarDia(d.key)}
                style={{
                  ...botaoSecundario,
                  padding: '6px 12px',
                  background: ativo ? 'var(--amber-dim)' : 'transparent',
                  borderColor: ativo ? 'var(--amber-border)' : 'var(--border)',
                  color: ativo ? 'var(--amber)' : 'var(--text-2)',
                  fontWeight: ativo ? 600 : 400,
                }}
              >
                {d.curto}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setDestinos(['seg', 'ter', 'qua', 'qui', 'sex'])}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginBottom: 18,
            color: 'var(--amber)',
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Selecionar segunda a sexta
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={blocos.length === 0 || destinos.length === 0}
            onClick={() => onAplicar(blocos, destinos)}
            style={{
              ...botaoPrimario,
              flex: 1,
              opacity: blocos.length === 0 || destinos.length === 0 ? 0.4 : 1,
            }}
          >
            Importar {blocos.length > 0 ? `${blocos.length} blocos` : ''}
          </button>
          <button onClick={onFechar} style={{ ...botaoSecundario, border: '1px solid transparent' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
