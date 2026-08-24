import type { AiTurnResponse, TrainerSessionConfig } from '../types/trainer'
import { EMPTY_MILESTONES } from '../types/trainer'

/** Легитимные слова — не проверять на вхождение корней мата */
const SAFE_WORDS = [
  'потребность',
  'потребностям',
  'потребности',
  'потребностей',
  'помощник',
  'помощников',
  'помощники',
  'потребления',
  'употребление',
  'руководство',
  'художник',
  'оскорбление',
]

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

/** Корни ≤3 символов — только как отдельное слово или короткая матерная форма */
const SHORT_ROOT_MAX_LEN = 3

/** Явный обход фильтра пробелами/символами между буквами */
const OBFUSCATED_PATTERNS: RegExp[] = [
  /б[\s\-_*.,!]*л[\s\-_*.,!]*[яь]/iu,
  /п[\s\-_*.,!]*и[\s\-_*.,!]*з[\s\-_*.,!]*д/iu,
  /[хx][\s\-_*.,!]*[уy][\s\-_*.,!]*[йиeе]/iu,
  /[eеё][\s\-_*.,!]*[bб][\s\-_*.,!]*[aа@]/iu,
  /с[\s\-_*.,!]*у[\s\-_*.,!]*[кk][\s\-_*.,!]*[aа@]/iu,
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
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(normalized: string): string[] {
  return normalized.split(/\s+/).filter(Boolean)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsAsWord(normalized: string, word: string): boolean {
  if (!word) return false
  const pattern = new RegExp(`(?:^|[\\s,.!?])${escapeRegExp(word)}(?:$|[\\s,.!?])`, 'i')
  return pattern.test(normalized) || normalized === word
}

function isSafeToken(token: string): boolean {
  return SAFE_WORDS.some(
    (safe) => token === safe || token.startsWith(safe) || safe.startsWith(token),
  )
}

function rootMatchesToken(root: string, token: string): boolean {
  if (token === root) return true
  if (!token.startsWith(root)) return false

  if (root.length <= SHORT_ROOT_MAX_LEN) {
    return token.length <= root.length + 3
  }

  return token.length <= root.length + 5
}

function containsObfuscatedProfanity(text: string): boolean {
  return OBFUSCATED_PATTERNS.some((pattern) => pattern.test(text))
}

function containsProfanityRoots(text: string): boolean {
  const normalized = normalize(text)

  for (const token of tokenize(normalized)) {
    if (isSafeToken(token)) continue

    for (const root of PROFANITY_ROOTS) {
      if (rootMatchesToken(root, token)) return true
    }
  }

  return false
}

function containsInsults(text: string): boolean {
  const normalized = normalize(text)
  return INSULT_WORDS.some((word) => containsAsWord(normalized, word))
}

function containsLatinProfanity(text: string): boolean {
  const normalized = normalize(text)
  return tokenize(normalized).some((token) =>
    LATIN_PROFANITY.some((word) => token === word || token.startsWith(word)),
  )
}

function containsAngerPhrases(text: string): boolean {
  const normalized = normalize(text)
  return ANGER_PHRASES.some((phrase) => normalized.includes(phrase))
}

export function containsProfanityOrAbuse(text: string): boolean {
  if (!text.trim()) return false

  const profanity = containsProfanityRoots(text) || containsObfuscatedProfanity(text)
  const insult = containsInsults(text)
  const latin = containsLatinProfanity(text)
  const anger = containsAngerPhrases(text)

  // CAPS сам по себе не триггерит — только мат, оскорбления, латиница или агрессивные фразы
  return profanity || insult || latin || anger
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
    milestones: { ...EMPTY_MILESTONES },
    hint_on_demand: '',
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
