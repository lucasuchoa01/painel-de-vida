import { useState, useEffect } from 'react'
import { Direction } from '../types'

interface Props {
  direction: Direction | null
  onSave: (data: {
    lifeDirection: string
    idealSelf: string
    weeklyFocus: string[]
    values: string[]
    currentIncome: string[]
    shouldIncome: string[]
  }) => Promise<void>
}

export default function DirectionBlock({ direction, onSave }: Props) {
  const [lifeDirection, setLifeDirection] = useState('')
  const [idealSelf, setIdealSelf] = useState('')
  const [weeklyFocusInput, setWeeklyFocusInput] = useState('')
  const [weeklyFocus, setWeeklyFocus] = useState<string[]>([])
  const [valuesInput, setValuesInput] = useState('')
  const [values, setValues] = useState<string[]>([])
  const [currentIncomeInput, setCurrentIncomeInput] = useState('')
  const [currentIncome, setCurrentIncome] = useState<string[]>([])
  const [shouldIncomeInput, setShouldIncomeInput] = useState('')
  const [shouldIncome, setShouldIncome] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
  if (direction) {
    setLifeDirection(direction.lifeDirection ?? '')
    setIdealSelf(direction.idealSelf ?? '')
    setWeeklyFocus(direction.weeklyFocus ?? [])
    setValues(direction.values ?? [])
    const ci = (direction as any).currentIncome
    const si = (direction as any).shouldIncome
    setCurrentIncome(Array.isArray(ci) ? ci : ci ? [ci] : [])
    setShouldIncome(Array.isArray(si) ? si : si ? [si] : [])
  }
}, [direction])

  const addFocus = () => {
    if (weeklyFocusInput.trim() && weeklyFocus.length < 3) {
      setWeeklyFocus([...weeklyFocus, weeklyFocusInput.trim()])
      setWeeklyFocusInput('')
    }
  }

  const addValue = () => {
    if (valuesInput.trim()) {
      setValues([...values, valuesInput.trim()])
      setValuesInput('')
    }
  }

  const addCurrentIncome = () => {
    if (currentIncomeInput.trim()) {
      setCurrentIncome([...currentIncome, currentIncomeInput.trim()])
      setCurrentIncomeInput('')
    }
  }

  const addShouldIncome = () => {
    if (shouldIncomeInput.trim()) {
      setShouldIncome([...shouldIncome, shouldIncomeInput.trim()])
      setShouldIncomeInput('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave({ lifeDirection, idealSelf, weeklyFocus, values, currentIncome, shouldIncome })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Pill = ({ text, onRemove, color }: { text: string; onRemove: () => void; color?: string }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', background: 'var(--bg-4)',
      border: `1px solid ${color ?? 'var(--border)'}`, borderRadius: 20,
      fontSize: '0.8rem', color: 'var(--text-2)',
    }}>
      {text}
      <button onClick={onRemove} style={{ color: 'var(--text-3)', fontSize: '0.7rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
    </span>
  )

  const SectionHint = ({ text }: { text: string }) => (
    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
      {text}
    </p>
  )

  const ListInput = ({
    value, onChange, onAdd, onKeyDown, placeholder, disabled,
  }: {
    value: string
    onChange: (v: string) => void
    onAdd: () => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    placeholder: string
    disabled?: boolean
  }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown ?? ((e) => e.key === 'Enter' && onAdd())}
        disabled={disabled}
      />
      <button className="btn btn-ghost" onClick={onAdd} disabled={disabled}>+</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--amber)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          🧭 DIREÇÃO DA VIDA
        </label>
        <SectionHint text="Para onde você está indo? O que quer construir? Quem quer ser daqui a 5 anos?" />
        <textarea rows={4} placeholder="Ex: Quero ser um trader profissional e viver de renda variável..." value={lifeDirection} onChange={(e) => setLifeDirection(e.target.value)} />
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--purple)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          🧠 VERSÃO IDEAL DE MIM
        </label>
        <SectionHint text="Como a versão ideal de você age? Quais hábitos tem? Como se sente?" />
        <textarea rows={3} placeholder="Ex: Acorda cedo, opera com disciplina, não opera no impulso..." value={idealSelf} onChange={(e) => setIdealSelf(e.target.value)} />
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--blue)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          🎯 FOCO DA SEMANA <span style={{ color: 'var(--text-3)' }}>(máx. 3)</span>
        </label>
        <SectionHint text="O que você precisa avançar ESSA semana para chegar mais perto do seu objetivo?" />
        <ListInput value={weeklyFocusInput} onChange={setWeeklyFocusInput} onAdd={addFocus} placeholder="Adicionar foco..." disabled={weeklyFocus.length >= 3} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {weeklyFocus.map((f, i) => (
            <Pill key={i} text={f} onRemove={() => setWeeklyFocus(weeklyFocus.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--green)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          ⚡ VALORES / LEMBRETES FIXOS
        </label>
        <SectionHint text="Princípios que você não abre mão. Aparecem todo dia na tela inicial como âncoras mentais." />
        <ListInput value={valuesInput} onChange={setValuesInput} onAdd={addValue} placeholder="Ex: Disciplina é liberdade" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {values.map((v, i) => (
            <Pill key={i} text={v} onRemove={() => setValues(values.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>

      {/* Foco de receita */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--amber)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>
          💰 FOCO DE RECEITA
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.75rem', color: '#4ade80', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            💰 O QUE ESTÁ ME GERANDO DINHEIRO HOJE
          </label>
          <SectionHint text="Liste suas fontes de renda atuais. Clareza sobre o que já funciona é o ponto de partida." />
          <ListInput value={currentIncomeInput} onChange={setCurrentIncomeInput} onAdd={addCurrentIncome} placeholder="Ex: Trading PETR4, freela de design..." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {currentIncome.map((v, i) => (
              <Pill key={i} text={v} color="rgba(74,222,128,0.3)" onRemove={() => setCurrentIncome(currentIncome.filter((_, j) => j !== i))} />
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            🚀 O QUE DEVERIA ESTAR GERANDO
          </label>
          <SectionHint text="Oportunidades que você ainda não explorou ou está deixando na mesa. O que falta para ativar?" />
          <ListInput value={shouldIncomeInput} onChange={setShouldIncomeInput} onAdd={addShouldIncome} placeholder="Ex: Operar conta real, escalar estratégia X..." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {shouldIncome.map((v, i) => (
              <Pill key={i} text={v} color="rgba(245,158,11,0.3)" onRemove={() => setShouldIncome(shouldIncome.filter((_, j) => j !== i))} />
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar direção'}
      </button>

    </div>
  )
}
