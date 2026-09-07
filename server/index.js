import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY?.trim() ||
  process.env.VITE_OPENROUTER_API_KEY?.trim() ||
  ''
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const app = express()
app.use(express.json({ limit: '512kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: Boolean(OPENROUTER_API_KEY) })
})

app.post('/api/chat/completions', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
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

  const body = {
    model: typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_MODEL,
    messages,
    temperature: 0.5,
    max_tokens: typeof maxTokens === 'number' ? maxTokens : 1200,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': req.get('origin') || req.get('referer') || '',
        'X-Title': 'NVC Communication Trainer',
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    res.status(response.status).type('json').send(text)
  } catch {
    res.status(502).json({ error: { message: 'Ошибка связи с OpenRouter' } })
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
