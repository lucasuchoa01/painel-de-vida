import { useState, useEffect } from 'react'
import { DailyLog } from '../types'

interface Props {
  todayLog: DailyLog | null
  onSave: (data: { good: string; bad: string; improve: string }) => Promise<void>
}

export default function DailyReview({ todayLog, onSave }: Props) {
  const [good, setGood] = useState('')
  const [bad, setBad] = useState('')
  const [improve, setImprove] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todayLog) {
      setGood(todayLog.good)
      setBad(todayLog.bad)
      setImprove(todayLog.improve)
    }
  }, [todayLog])

  const handleSave = async () => {
    setSaving(true)
    await onSave({ good, bad, improve })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: '✅ O que fiz bem', value: good, set: setGood, color: 'var(--green)' },
        { label: '❌ Onde vacilei', value: bad, set: setBad, color: 'var(--red)' },
        { label: '🔁 O que melhorar amanhã', value: improve, set: setImprove, color: 'var(--blue)' },
      ].map(({ label, value, set, color }) => (
        <div key={label}>
          <label style={{ fontSize: '0.75rem', color, display: 'block', marginBottom: 5, fontWeight: 500 }}>
            {label}
          </label>
          <textarea
            rows={2}
            placeholder="Escreva aqui..."
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      ))}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ alignSelf: 'flex-end', minWidth: 110 }}
      >
        {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar review'}
      </button>
    </div>
  )
}
