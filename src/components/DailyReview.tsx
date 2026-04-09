import { useState, useEffect } from 'react'
import { DailyLog } from '../types'

interface Props {
  todayLog: DailyLog | null
  onSave: (data: { good: string; bad: string; improve: string }) => Promise<void>
}

const fields = [
  {
    key: 'good' as const,
    label: '✅ O que fiz bem',
    color: 'var(--green)',
    hint: 'O que funcionou hoje? Alguma decisão certa, hábito mantido, tarefa importante concluída.',
    placeholder: 'Ex: Não operei no impulso, fiz minha leitura diária...',
  },
  {
    key: 'bad' as const,
    label: '❌ Onde vacilei',
    color: 'var(--red)',
    hint: 'O que poderia ter feito melhor? Sem julgamento, só honestidade.',
    placeholder: 'Ex: Fiquei no celular quando devia estar estudando...',
  },
  {
    key: 'improve' as const,
    label: '🔁 O que melhorar amanhã',
    color: 'var(--blue)',
    hint: 'Uma ação concreta para o dia seguinte. Simples e específica.',
    placeholder: 'Ex: Definir horário fixo para operar, estudar 30min antes do mercado...',
  },
]

export default function DailyReview({ todayLog, onSave }: Props) {
  const [good, setGood] = useState('')
  const [bad, setBad] = useState('')
  const [improve, setImprove] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setters = { good: setGood, bad: setBad, improve: setImprove }
  const values = { good, bad, improve }

  useEffect(() => {
    if (todayLog) {
      setGood(todayLog.good ?? '')
      setBad(todayLog.bad ?? '')
      setImprove(todayLog.improve ?? '')
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {fields.map(({ key, label, color, hint, placeholder }) => (
        <div key={key}>
          <label style={{ fontSize: '0.75rem', color, display: 'block', marginBottom: 3, fontWeight: 600 }}>
            {label}
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
            {hint}
          </p>
          <textarea
            rows={2}
            placeholder={placeholder}
            value={values[key]}
            onChange={(e) => setters[key](e.target.value)}
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
