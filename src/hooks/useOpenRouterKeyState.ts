import { getEnvApiKey } from './useOpenRouterKey'

/** API key is injected at build time via VITE_OPENROUTER_API_KEY — not shown in UI. */
export function useOpenRouterKey() {
  const apiKey = getEnvApiKey()
  return { apiKey, hasKey: Boolean(apiKey) }
}
