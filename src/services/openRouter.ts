export const CHAT_API_URL = '/api/chat/completions'

export interface AiProviderMessage {
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
  messages: AiProviderMessage[]
  maxTokens: number
  jsonMode: boolean
}

interface ApiErrorPayload {
  code?: string
  message?: string
  error?: { message?: string; code?: string }
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

function isSafetyBlock(code?: string, message?: string): boolean {
  const haystack = `${code ?? ''} ${message ?? ''}`.toLowerCase()
  return (
    haystack.includes('content_filter') ||
    haystack.includes('content_policy') ||
    haystack.includes('safety') ||
    haystack.includes('moderation') ||
    haystack.includes('blocked') ||
    haystack.includes('harm')
  )
}

export function isProviderSafetyError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('политик безопасности') ||
    lower.includes('content_filter') ||
    lower.includes('content_policy') ||
    lower.includes('safety')
  )
}

function parseApiError(errorText: string, model: string): string {
  try {
    const parsed = JSON.parse(errorText) as ApiErrorPayload
    const code = parsed.error?.code ?? parsed.code
    const apiMsg = parsed.error?.message ?? parsed.message
    if (code === 'FIRST_TOP_UP_REQUIRED') {
      return 'Эта модель Provod недоступна до пополнения баланса. Используется доступная модель из бесплатного каталога.'
    }
    if (isSafetyBlock(code, apiMsg) || isSafetyBlock(code, errorText)) {
      return 'Провайдер отклонил сообщение из‑за политики безопасности. В тренажёре нельзя использовать угрозы и оскорбления.'
    }
    if (apiMsg) {
      if (apiMsg.includes('No endpoints found')) {
        return `Модель «${model}» недоступна. Проверьте PROVOD_MODEL на сервере.`
      }
      if (apiMsg.includes('Тренажёр временно недоступен')) {
        return apiMsg
      }
      return apiMsg.trim() || 'Ошибка Provod.ai'
    }
  } catch {
    // keep raw
  }
  if (isSafetyBlock(undefined, errorText)) {
    return 'Провайдер отклонил сообщение из‑за политики безопасности. В тренажёре нельзя использовать угрозы и оскорбления.'
  }
  return errorText.trim() || 'Ошибка Provod.ai'
}

export function formatCostUsd(cost: number): string {
  if (cost <= 0) return '$0.00'
  if (cost < 0.0001) return '<$0.0001'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(3)}`
}

function getChatApiUrl(): string {
  return new URL(CHAT_API_URL, window.location.origin).href
}

async function requestCompletion(body: RequestBody): Promise<ChatCompletionResult> {
  const response = await fetch(getChatApiUrl(), {
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
    choices?: Array<{
      finish_reason?: string
      message?: { content?: string }
    }>
    usage?: { cost?: number }
  }

  const choice = data.choices?.[0]
  const content = choice?.message?.content
  const finishReason = (choice?.finish_reason ?? '').toLowerCase()
  if (
    finishReason.includes('safety') ||
    finishReason.includes('content_filter') ||
    finishReason.includes('moderation')
  ) {
    throw new Error(
      'Провайдер отклонил сообщение из‑за политики безопасности. В тренажёре нельзя использовать угрозы и оскорбления.',
    )
  }
  if (!content) {
    throw new Error('Provod.ai вернул пустой ответ')
  }

  return {
    content,
    costUsd: data.usage?.cost ?? 0,
    model: data.model ?? body.model ?? 'unknown',
  }
}

export async function chatCompletion(
  messages: AiProviderMessage[],
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

  throw lastError ?? new Error('Не удалось получить ответ от Provod.ai')
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
      'Provod.ai вернул ответ не в формате JSON. Проверьте модель на сервере.',
    )
  }
}
