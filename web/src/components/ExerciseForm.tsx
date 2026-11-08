import { useState, type FormEvent } from 'react'
import type { Exercise } from '../types'

export interface ExerciseFormValues {
  name: string
  target_sets: number | null
  target_reps: string | null
  default_weight: number | null
  weight_unit: string
  cue: string | null
}

export function ExerciseForm({
  initial,
  onCancel,
  onSave,
  submitLabel = 'Save',
}: {
  initial?: Exercise
  onCancel: () => void
  onSave: (payload: ExerciseFormValues) => Promise<void>
  submitLabel?: string
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sets, setSets] = useState(initial?.target_sets?.toString() ?? '')
  const [reps, setReps] = useState(initial?.target_reps ?? '')
  const [weight, setWeight] = useState(initial?.default_weight?.toString() ?? '')
  const [unit, setUnit] = useState(initial?.weight_unit ?? 'kg')
  const [cue, setCue] = useState(initial?.cue ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        target_sets: sets ? Number(sets) : null,
        target_reps: reps || null,
        default_weight: weight ? Number(weight) : null,
        weight_unit: unit || 'kg',
        cue: cue || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="entity-form" onSubmit={submit} autoComplete="off">
      <input
        placeholder="Exercise (e.g. Bench Press)"
        name="exercise-title"
        autoComplete="off"
        autoCorrect="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <div className="entity-form-row">
        <input placeholder="sets" type="number" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} />
        <input
          placeholder="reps (e.g. 12 or failure)"
          value={reps ?? ''}
          onChange={(e) => setReps(e.target.value)}
          className="grow"
          autoComplete="off"
        />
        <input
          placeholder="target weight"
          type="number"
          inputMode="decimal"
          step="0.25"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input placeholder="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="unit-input" autoComplete="off" />
      </div>
      <textarea
        placeholder="Shared form cue, visible to everyone (e.g. elbows tucked in, arch your back)"
        value={cue ?? ''}
        onChange={(e) => setCue(e.target.value)}
        rows={2}
      />
      <div className="entity-form-actions">
        <button type="submit" className="primary small" disabled={saving}>
          {submitLabel}
        </button>
        <button type="button" className="link-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
