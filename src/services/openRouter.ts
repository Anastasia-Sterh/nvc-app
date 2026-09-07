export const CHAT_API_URL = '/api/chat/completions'

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
  model?: string
  messages: OpenRouterMessage[]
  maxTokens: number
  jsonMode: boolean
}

interface ApiErrorPayload {
  error?: { message?: string }
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
    const parsed = JSON.parse(errorText) as ApiErrorPayload
    const apiMsg = parsed.error?.message
    if (apiMsg) {
      if (apiMsg.includes('No endpoints found')) {
        return `Модель «${model}» недоступна. Проверьте OPENROUTER_MODEL на сервере.`
      }
      if (apiMsg.includes('Тренажёр временно недоступен')) {
        return apiMsg
      }
      return apiMsg
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

async function requestCompletion(body: RequestBody): Promise<ChatCompletionResult> {
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(parseApiError(errorText, body.model ?? 'default'))
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
    model: data.model ?? body.model ?? 'unknown',
  }
}

export async function chatCompletion(
  messages: OpenRouterMessage[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const maxTokens = options.maxTokens ?? 1200
  const model = options.model
  const base = { messages, maxTokens, model }

  const attempts: RequestBody[] = [
    { ...base, jsonMode: true },
    { ...base, jsonMode: false },
  ]

  let lastError: Error | null = null

  for (const body of attempts) {
    try {
      return await requestCompletion(body)
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
      'OpenRouter вернул ответ не в формате JSON. Проверьте модель на сервере.',
    )
  }
}
