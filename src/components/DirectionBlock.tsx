import { useState, useEffect } from 'react'
import { Direction } from '../types'

interface Props {
  direction: Direction | null
  onSave: (data: {
    lifeDirection: string
    idealSelf: string
    weeklyFocus: string[]
    values: string[]
  }) => Promise<void>
}

export default function DirectionBlock({ direction, onSave }: Props) {
  const [lifeDirection, setLifeDirection] = useState('')
  const [idealSelf, setIdealSelf] = useState('')
  const [weeklyFocusInput, setWeeklyFocusInput] = useState('')
  const [weeklyFocus, setWeeklyFocus] = useState<string[]>([])
  const [valuesInput, setValuesInput] = useState('')
  const [values, setValues] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (direction) {
      setLifeDirection(direction.lifeDirection ?? '')
      setIdealSelf(direction.idealSelf ?? '')
      setWeeklyFocus(direction.weeklyFocus ?? [])
      setValues(direction.values ?? [])
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

  const handleSave = async () => {
    setSaving(true)
    await onSave({ lifeDirection, idealSelf, weeklyFocus, values })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Pill = ({ text, onRemove }: { text: string; onRemove: () => void }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', background: 'var(--bg-4)',
      border: '1px solid var(--border)', borderRadius: 20,
      fontSize: '0.8rem', color: 'var(--text-2)',
    }}>
      {text}
      <button onClick={onRemove} style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>✕</button>
    </span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--amber)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
          🧭 DIREÇÃO DA VIDA
        </label>
        <textarea
          rows={4}
          placeholder="Para onde você está indo? O que quer construir? Quem quer ser daqui a 5 anos?"
          value={lifeDirection}
          onChange={(e) => setLifeDirection(e.target.value)}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--purple)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
          🧠 VERSÃO IDEAL DE MIM
        </label>
        <textarea
          rows={3}
          placeholder="Como a versão ideal de você age? Quais hábitos tem? Como se sente?"
          value={idealSelf}
          onChange={(e) => setIdealSelf(e.target.value)}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--blue)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
          🎯 FOCO DA SEMANA <span style={{ color: 'var(--text-3)' }}>(máx. 3)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Adicionar foco..."
            value={weeklyFocusInput}
            onChange={(e) => setWeeklyFocusInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFocus()}
            disabled={weeklyFocus.length >= 3}
          />
          <button className="btn btn-ghost" onClick={addFocus} disabled={weeklyFocus.length >= 3}>+</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {weeklyFocus.map((f, i) => (
            <Pill key={i} text={f} onRemove={() => setWeeklyFocus(weeklyFocus.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--green)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
          ⚡ VALORES / LEMBRETES FIXOS
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Ex: Disciplina é liberdade"
            value={valuesInput}
            onChange={(e) => setValuesInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addValue()}
          />
          <button className="btn btn-ghost" onClick={addValue}>+</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {values.map((v, i) => (
            <Pill key={i} text={v} onRemove={() => setValues(values.filter((_, j) => j !== i))} />
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar direção'}
      </button>
    </div>
  )
}
