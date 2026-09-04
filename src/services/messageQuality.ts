const SINGLE_WORD_FILLERS = new Set([
  'да',
  'нет',
  'ну',
  'ок',
  'ok',
  'okay',
  'хз',
  'ладно',
  'угу',
  'ага',
  'test',
  'тест',
  'asdf',
  'qwerty',
  'йцукен',
  'фыва',
  'привет',
  'hello',
  'hi',
  'бла',
  'что',
  'зачем',
  'почему',
  'когда',
  'где',
  'э',
  'а',
  'и',
])

const GARBAGE_TOKENS = ['asdf', 'qwerty', 'йцукен', 'фыва', 'qwe', 'asd', 'zxc', 'xxx', '12345']

/** Пустой, слишком короткий или явно бессмысленный ответ пользователя. */
export function isMeaninglessUserMessage(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true

  const letters = trimmed.match(/[a-zA-Zа-яА-ЯёЁ]/g)
  if (!letters || letters.length < 3) return true

  const compact = trimmed.replace(/\s+/g, '')
  if (compact.length < 4) return true
  if (/^(.)\1{4,}$/u.test(compact)) return true

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = normalized.split(' ').filter(Boolean)

  if (words.length === 1) {
    const word = words[0]
    if (SINGLE_WORD_FILLERS.has(word) || word.length < 4) return true
    if (GARBAGE_TOKENS.some((token) => word.includes(token))) return true
  }

  if (words.length <= 2 && GARBAGE_TOKENS.some((token) => normalized.includes(token))) {
    return true
  }

  return false
}

export const MEANINGLESS_FEEDBACK =
  'Ответ пустой, слишком короткий или не по теме — прогресс по шкале не начислен.'
