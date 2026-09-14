import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
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

const CATEGORIAS: Record<CategoriaKey, { nome: string; barra: string; chip: string }> = {
  trabalho: { nome: 'Medicina S/A', barra: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  trading: { nome: 'Trading', barra: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  corpo: { nome: 'Corpo', barra: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  pessoal: { nome: 'Pessoal', barra: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  estudo: { nome: 'Estudo', barra: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700 border-slate-300' },
}

const ROTINA_VAZIA: Rotina = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }

// Ponto de partida: dias úteis com o formato que você descreveu.
// É só editar/apagar direto na tela depois.
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

const ordenar = (blocos: Bloco[]) => [...blocos].sort((a, b) => emMinutos(a.inicio) - emMinutos(b.inicio))

const diaDeHoje = (): DiaKey => (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as DiaKey[])[new Date().getDay()]

const modeloComIds = (): Rotina => {
  const gerar = () => MODELO_UTIL.map((b) => ({ ...b, id: novoId() }))
  return { ...ROTINA_VAZIA, seg: gerar(), ter: gerar(), qua: gerar(), qui: gerar(), sex: gerar() }
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

  // relógio para o marcador "agora" (atualiza a cada minuto)
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // carrega do Firestore
  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'rotinas', user.uid))
        if (!ativo) return
        if (snap.exists()) {
          setRotina({ ...ROTINA_VAZIA, ...(snap.data().dias as Rotina) })
        } else {
          setRotina(modeloComIds())
        }
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
    return <div className="p-6 text-sm text-slate-500">Carregando sua rotina…</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Rotina</h1>
        <span className="text-xs text-slate-400">{salvando ? 'Salvando…' : 'Tudo salvo'}</span>
      </header>

      {erro && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
      )}

      {/* Seletor de dia */}
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {DIAS.map((d) => {
          const ativo = d.key === dia
          const hoje = d.key === diaDeHoje()
          return (
            <button
              key={d.key}
              onClick={() => setDia(d.key)}
              className={`flex min-w-[3rem] flex-1 flex-col items-center rounded-lg border px-2 py-2 text-sm transition ${
                ativo
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{d.curto}</span>
              {hoje && (
                <span className={`mt-1 h-1 w-1 rounded-full ${ativo ? 'bg-white' : 'bg-slate-900'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Resumo do dia */}
      {totais.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {totais.map(([cat, min]) => (
            <span
              key={cat}
              className={`rounded-full border px-2.5 py-1 text-xs ${CATEGORIAS[cat].chip}`}
            >
              {CATEGORIAS[cat].nome} · {formatarDuracao(min)}
            </span>
          ))}
        </div>
      )}

      {/* Lista de blocos */}
      {blocos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-sm text-slate-500">
            {DIAS.find((d) => d.key === dia)?.longo} ainda está livre.
          </p>
          <button
            onClick={() => {
              setEditando(null)
              setFormAberto(true)
            }}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar o primeiro bloco
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {blocos.map((b, i) => {
            const anterior = blocos[i - 1]
            const conflito = anterior && emMinutos(anterior.fim) > emMinutos(b.inicio)
            const emAndamento =
              ehHoje && minutosAgora >= emMinutos(b.inicio) && minutosAgora < emMinutos(b.fim)

            return (
              <li key={b.id}>
                <button
                  onClick={() => {
                    setEditando(b)
                    setFormAberto(true)
                  }}
                  className={`flex w-full items-stretch gap-3 rounded-xl border bg-white p-3 text-left transition hover:border-slate-300 ${
                    emAndamento ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
                  }`}
                >
                  <span className={`w-1 shrink-0 rounded-full ${CATEGORIAS[b.categoria].barra}`} />
                  <span className="w-[4.5rem] shrink-0 tabular-nums text-sm text-slate-500">
                    {b.inicio}
                    <br />
                    {b.fim}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{b.titulo}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {CATEGORIAS[b.categoria].nome} · {formatarDuracao(duracao(b))}
                      {emAndamento && ' · agora'}
                      {conflito && ' · choca com o bloco anterior'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Ações */}
      <div className="mt-5 flex flex-wrap gap-2">
        {blocos.length > 0 && (
          <button
            onClick={() => {
              setEditando(null)
              setFormAberto(true)
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar bloco
          </button>
        )}
        {blocos.length > 0 && (
          <button
            onClick={() => setCopiaAberta((v) => !v)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            Copiar este dia
          </button>
        )}
      </div>

      {copiaAberta && (
        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-sm text-slate-600">
            Copiar {DIAS.find((d) => d.key === dia)?.longo} para qual dia? O conteúdo do destino é substituído.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DIAS.filter((d) => d.key !== dia).map((d) => (
              <button
                key={d.key}
                onClick={() => copiarPara(d.key)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-slate-900"
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
   Formulário (painel inferior)
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

  const invalido = !titulo.trim() || emMinutos(fim) <= emMinutos(inicio)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40" onClick={onFechar}>
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-white p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {bloco ? 'Editar bloco' : 'Novo bloco'}
        </h2>

        <div className="mb-3 flex gap-3">
          <label className="flex-1 text-sm text-slate-600">
            Começa
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex-1 text-sm text-slate-600">
            Termina
            <input
              type="time"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
        </div>

        <label className="mb-3 block text-sm text-slate-600">
          O que é
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Medicina S/A, academia, almoço"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORIAS) as CategoriaKey[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                categoria === c ? CATEGORIAS[c].chip : 'border-slate-200 text-slate-500'
              }`}
            >
              {CATEGORIAS[c].nome}
            </button>
          ))}
        </div>

        {emMinutos(fim) <= emMinutos(inicio) && (
          <p className="mb-3 text-sm text-red-600">O fim precisa ser depois do começo.</p>
        )}

        <div className="flex gap-2">
          <button
            disabled={invalido}
            onClick={() =>
              onSalvar({ id: bloco?.id ?? novoId(), inicio, fim, titulo: titulo.trim(), categoria })
            }
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Salvar bloco
          </button>
          {bloco && (
            <button
              onClick={() => onRemover(bloco.id)}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm text-red-700"
            >
              Excluir
            </button>
          )}
          <button onClick={onFechar} className="rounded-lg px-4 py-2.5 text-sm text-slate-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
