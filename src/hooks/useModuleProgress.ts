import { useCallback, useState } from 'react'
import { learningGoals, type GoalId } from '../data/learningGoals'

const STORAGE_KEY = 'nvc-completed-modules'

function readCompleted(): GoalId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is GoalId =>
      learningGoals.some((g) => g.id === id),
    )
  } catch {
    return []
  }
}

export function useModuleProgress() {
  const [completed, setCompleted] = useState<GoalId[]>(readCompleted)

  const markComplete = useCallback((id: GoalId) => {
    setCompleted((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const allComplete = learningGoals.every((g) => completed.includes(g.id))

  return { completed, markComplete, allComplete }
}
