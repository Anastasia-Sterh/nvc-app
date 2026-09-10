import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const PROVOD_API_KEY = process.env.PROVOD_API_KEY?.trim() ?? ''
const PREFERRED_MODEL = process.env.PROVOD_MODEL ?? 'gemini-2.5-flash'
const FALLBACK_MODEL = process.env.PROVOD_FALLBACK_MODEL ?? 'gemini-3.1-flash-lite'
const PROVOD_API_URL = 'https://api.provod.ai/v1/chat/completions'

const app = express()
app.use(express.json({ limit: '512kb' }))

function parseProvodPayload(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function providerError(payload, text) {
  if (payload?.error && typeof payload.error === 'object') return payload.error
  if (payload && (payload.code || payload.message)) return payload
  return { message: text || 'Ошибка Provod.ai' }
}

async function callProvod(model, messages, maxTokens, jsonMode) {
  const body = {
    model,
    messages,
    temperature: 0.5,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  const response = await fetch(PROVOD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PROVOD_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  return { ok: response.ok, status: response.status, text, payload: parseProvodPayload(text) }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: Boolean(PROVOD_API_KEY), provider: 'provod.ai' })
})

app.post('/api/chat/completions', async (req, res) => {
  if (!PROVOD_API_KEY) {
    res.status(503).json({
      error: { message: 'Тренажёр временно недоступен. Попробуйте позже.' },
    })
    return
  }

  const { messages, model, maxTokens, jsonMode } = req.body ?? {}

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: { message: 'Некорректный запрос' } })
    return
  }

  const requested =
    typeof model === 'string' && model.trim() ? model.trim() : PREFERRED_MODEL
  const tokenLimit = typeof maxTokens === 'number' ? maxTokens : 1200
  const useJson = Boolean(jsonMode)

  try {
    let result = await callProvod(requested, messages, tokenLimit, useJson)
    let usedModel = requested

    const firstError = providerError(result.payload, result.text)
    if (
      !result.ok &&
      firstError.code === 'FIRST_TOP_UP_REQUIRED' &&
      requested !== FALLBACK_MODEL
    ) {
      result = await callProvod(FALLBACK_MODEL, messages, tokenLimit, useJson)
      usedModel = FALLBACK_MODEL
    }

    if (!result.ok) {
      const err = providerError(result.payload, result.text)
      const message =
        err.code === 'FIRST_TOP_UP_REQUIRED'
          ? 'Эта модель Provod недоступна до первого пополнения баланса. Сейчас используется бесплатный каталог — пополните баланс, чтобы открыть gemini-2.5-flash.'
          : err.message || 'Ошибка Provod.ai'

      res.status(result.status).json({ error: { message, code: err.code } })
      return
    }

    if (result.payload && typeof result.payload === 'object') {
      result.payload.model = result.payload.model || usedModel
      res.status(result.status).json(result.payload)
      return
    }

    res.status(result.status).type('json').send(result.text)
  } catch {
    res.status(502).json({ error: { message: 'Ошибка связи с Provod.ai' } })
  }
})

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
