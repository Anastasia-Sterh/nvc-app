import { useCallback, useState } from 'react'

const STORAGE_KEY = 'nvc-welcome-seen'

export function useWelcomeSeen() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  const markWelcomeSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setHasSeenWelcome(true)
  }, [])

  return { hasSeenWelcome, markWelcomeSeen }
}
