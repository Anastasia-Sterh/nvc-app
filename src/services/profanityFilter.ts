import type { AiTurnResponse, TrainerSessionConfig } from '../types/trainer'

const PROFANITY_ROOTS = [
  'хуй',
  'хуя',
  'хуе',
  'хуи',
  'хую',
  'хуё',
  'хуил',
  'пизд',
  'бля',
  'бляд',
  'блят',
  'ебан',
  'ебат',
  'ебал',
  'ебл',
  'ебаш',
  'ебн',
  'ёб',
  'сука',
  'суки',
  'суко',
  'пидор',
  'пидар',
  'пидарас',
  'мудак',
  'мудил',
  'залуп',
  'шлюх',
  'гандон',
  'гондон',
  'нахуй',
  'нахер',
  'хуесос',
  'охуе',
  'охуи',
  'похуй',
  'похер',
]

const INSULT_WORDS = [
  'идиот',
  'дебил',
  'придурок',
  'кретин',
  'урод',
  'мразь',
  'скотина',
  'тупой',
  'тупая',
  'тупое',
  'тупица',
  'ублюдок',
  'сволочь',
  'подонок',
  'отстой',
  'дурак',
  'дура',
  'козел',
  'козёл',
  'сучара',
  'мразота',
]

const LATIN_PROFANITY = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'blyat',
  'blyad',
  'hui',
  'huy',
  'pizda',
  'pizd',
  'ebal',
  'ebat',
  'suka',
  'nahui',
  'nahuy',
]

const ANGER_PHRASES = [
  'заткнись',
  'заткнитесь',
  'пошел нах',
  'пошёл нах',
  'пошла нах',
  'иди нах',
  'идите нах',
  'отвали',
  'пошел в',
  'пошёл в',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsAsWord(normalized: string, word: string): boolean {
  if (!word) return false
  const pattern = new RegExp(`(?:^|[\\s,.!?])${word}(?:$|[\\s,.!?])`, 'i')
  return pattern.test(normalized) || normalized === word
}

function containsProfanityRoots(text: string): boolean {
  const normalized = normalize(text)
  const compact = normalized.replace(/\s/g, '')
  return PROFANITY_ROOTS.some(
    (root) => normalized.includes(root) || compact.includes(root),
  )
}

function containsInsults(text: string): boolean {
  const normalized = normalize(text)
  return INSULT_WORDS.some((word) => containsAsWord(normalized, word))
}

function containsLatinProfanity(text: string): boolean {
  const normalized = normalize(text)
  const compact = normalized.replace(/\s/g, '')
  return LATIN_PROFANITY.some(
    (word) => containsAsWord(normalized, word) || compact.includes(word),
  )
}

function isAggressiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZА-Яа-яЁё]/g, '')
  if (letters.length < 12) return false

  const upperCount = (text.match(/[A-ZА-ЯЁ]/g) ?? []).length
  if (upperCount / letters.length < 0.75) return false

  const normalized = normalize(text)
  return (
    ANGER_PHRASES.some((phrase) => normalized.includes(phrase)) ||
    containsInsults(text) ||
    containsProfanityRoots(text)
  )
}

export function containsProfanityOrAbuse(text: string): boolean {
  if (!text.trim()) return false
  return (
    containsProfanityRoots(text) ||
    containsInsults(text) ||
    containsLatinProfanity(text) ||
    isAggressiveCaps(text)
  )
}

export function getNpcSpeakerName(session: TrainerSessionConfig): string {
  const fromHistory = session.initialMessages.find((m) => m.role === 'assistant')?.senderName
  if (fromHistory) return fromHistory
  return session.id === 'comprehensive' ? 'Сергей (начальник)' : 'Собеседник'
}

const PROFANITY_FEEDBACK =
  'Недопустимо использовать ненормативную лексику и грубые оскорбления в деловой коммуникации. Диалог прерван.'

export function buildProfanityHardStopResponse(
  session: TrainerSessionConfig,
  userMessageText: string,
  userMessageIndex: number,
): AiTurnResponse {
  return {
    communication_efficiency: 0,
    is_auto_completed: true,
    hint_from_mentor: { mentor_name: null, tip: null },
    dialogue: {
      speaker: getNpcSpeakerName(session),
      text: 'В таком тоне я разговор продолжать не буду. Диалог окончен.',
    },
    single_message_evaluations: [
      {
        user_message_index: userMessageIndex,
        user_message_text: userMessageText,
        murchik_nvo_score: 0,
        murchik_comment: PROFANITY_FEEDBACK,
        arni_harvard_score: 0,
        arni_comment: PROFANITY_FEEDBACK,
        bjorn_dearman_score: 0,
        bjorn_comment: PROFANITY_FEEDBACK,
      },
    ],
    final_summary: {
      overall_score: 0,
      murchik_final_feedback: PROFANITY_FEEDBACK,
      arni_final_feedback: PROFANITY_FEEDBACK,
      bjorn_final_feedback: PROFANITY_FEEDBACK,
    },
  }
}