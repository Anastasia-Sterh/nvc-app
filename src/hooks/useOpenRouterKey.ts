const STORAGE_KEY = 'openrouter-api-key'

export function getEnvApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY ?? ''
}

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function resolveApiKey(): string {
  return getStoredApiKey() || getEnvApiKey()
}

export function saveApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim())
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasApiKey(): boolean {
  return Boolean(resolveApiKey())
}
