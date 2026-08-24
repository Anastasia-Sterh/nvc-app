export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Fast JSON + Russian roleplay; successor to discontinued gemini-2.0-flash-001 */
export const DEFAULT_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL ?? 'google/gemini-2.5-flash'

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  maxTokens?: number
  model?: string
}

export interface ChatCompletionResult {
  content: string
  costUsd: number
  model: string
}

interface RequestBody {
  model: string
  messages: OpenRouterMessage[]
  temperature: number
  max_tokens: number
  response_format?: { type: 'json_object' }
}

function isRetryableProviderError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('provider returned error') ||
    lower.includes('no endpoints found') ||
    lower.includes('rate limit') ||
    lower.includes('overloaded')
  )
}

function parseApiError(errorText: string, model: string): string {
  try {
    const parsed = JSON.parse(errorText) as { error?: { message?: string } }
    const apiMsg = parsed.error?.message
    if (apiMsg) {
      return apiMsg.includes('No endpoints found')
        ? `Модель «${model}» недоступна. Проверьте VITE_OPENROUTER_MODEL в .env`
        : apiMsg
    }
  } catch {
    // keep raw
  }
  return errorText
}

export function formatCostUsd(cost: number): string {
  if (cost <= 0) return '$0.00'
  if (cost < 0.0001) return '<$0.0001'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(3)}`
}

async function requestCompletion(
  apiKey: string,
  body: RequestBody,
): Promise<ChatCompletionResult> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'NVC Communication Trainer',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(parseApiError(errorText, body.model))
  }

  const data = (await response.json()) as {
    model?: string
    choices?: Array<{ message?: { content?: string } }>
    usage?: { cost?: number }
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter вернул пустой ответ')
  }

  return {
    content,
    costUsd: data.usage?.cost ?? 0,
    model: data.model ?? body.model,
  }
}

export async function chatCompletion(
  apiKey: string,
  messages: OpenRouterMessage[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const maxTokens = options.maxTokens ?? 1200
  const model = options.model ?? DEFAULT_MODEL
  const base = { messages, temperature: 0.5, max_tokens: maxTokens }

  const attempts: RequestBody[] = [
    { ...base, model, response_format: { type: 'json_object' } },
    { ...base, model },
  ]

  let lastError: Error | null = null

  for (const body of attempts) {
    try {
      return await requestCompletion(apiKey, body)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      lastError = error
      if (!isRetryableProviderError(error.message)) {
        throw error
      }
    }
  }

  throw lastError ?? new Error('Не удалось получить ответ от OpenRouter')
}

export function parseAiJsonResponse(raw: string): unknown {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  let jsonText = fenced ? fenced[1].trim() : trimmed

  if (!jsonText.startsWith('{')) {
    const objMatch = jsonText.match(/\{[\s\S]*\}/)
    if (objMatch) jsonText = objMatch[0]
  }

  try {
    return JSON.parse(jsonText)
  } catch {
    throw new Error(
      'OpenRouter вернул ответ не в формате JSON. Проверьте модель и API-ключ.',
    )
  }
}
