import { useCallback, useState } from 'react'
import {
  clearStoredApiKey,
  getEnvApiKey,
  getStoredApiKey,
  saveApiKey,
} from './useOpenRouterKey'

export function useOpenRouterKey() {
  const [storedKey, setStoredKey] = useState(getStoredApiKey)

  const apiKey = storedKey || getEnvApiKey()
  const hasKey = Boolean(apiKey)

  const persistKey = useCallback((key: string) => {
    saveApiKey(key)
    setStoredKey(key.trim())
  }, [])

  const removeKey = useCallback(() => {
    clearStoredApiKey()
    setStoredKey('')
  }, [])

  return { apiKey, hasKey, persistKey, removeKey, envKeyPresent: Boolean(getEnvApiKey()) }
}
