import type {
  ChatMessage,
  TrainerSessionConfig,
  DialogueTurn,
  NegotiationMilestones,
  AiTurnResponse,
  FinalSummary,
} from '../types/trainer'
import { EMPTY_MILESTONES } from '../types/trainer'
import { isMeaninglessUserMessage, MEANINGLESS_FEEDBACK } from './messageQuality'

const JSON_SCHEMA = `{
  "communication_efficiency": number (0-100),
  "is_auto_completed": boolean,
  "hint_from_mentor": {
    "mentor_name": string | null,
    "tip": string | null
  },
  "dialogue": {
    "speaker": string,
    "text": string
  },
  "single_message_evaluations": [
    {
      "user_message_index": number,
      "user_message_text": string,
      "murchik_nvo_score": number (0-100),
      "murchik_comment": string,
      "arni_harvard_score": number (0-100),
      "arni_comment": string,
      "bjorn_dearman_score": number (0-100),
      "bjorn_comment": string
    }
  ],
  "final_summary": {
    "overall_score": number (0-100),
    "murchik_final_feedback": string,
    "arni_final_feedback": string,
    "bjorn_final_feedback": string
  } | null
}`

const COMPREHENSIVE_JSON_SCHEMA = `{
  "communication_efficiency": number (0-100),
  "is_auto_completed": boolean,
  "milestones": {
    "empathy_completed": boolean,
    "boundaries_completed": boolean,
    "win_win_completed": boolean
  },
  "hint_on_demand": string,
  "hint_from_mentor": {
    "mentor_name": string | null,
    "tip": string | null
  },
  "dialogue": {
    "speaker": "Сергей (начальник)",
    "text": string
  },
  "single_message_evaluations": [
    {
      "user_message_index": number,
      "user_message_text": string,
      "murchik_nvo_score": number (0-100),
      "murchik_comment": string,
      "arni_harvard_score": number (0-100),
      "arni_comment": string,
      "bjorn_dearman_score": number (0-100),
      "bjorn_comment": string
    }
  ],
  "final_summary": {
    "overall_score": number (0-100),
    "murchik_final_feedback": string,
    "arni_final_feedback": string,
    "bjorn_final_feedback": string
  } | null
}`

export const MILESTONE_STEPS = [
  {
    key: 'empathy' as const,
    label: 'Этап 1: Эмпатия',
    description: 'Примите чувства',
    mentor: 'Мурчик',
  },
  {
    key: 'boundaries' as const,
    label: 'Этап 2: Границы',
    description: 'Позаботьтесь о команде',
    mentor: 'Бьерн',
  },
  {
    key: 'win_win' as const,
    label: 'Этап 3: Взаимовыгода',
    description: 'Предложите альтернативы',
    mentor: 'Арни',
  },
]

export const MAX_ON_DEMAND_HINTS = 3

export const DISADVANTAGEOUS_AGREEMENT_HINT =
  'Вы согласились на невыгодные условия, не защитив интересы команды. Такая уступка закрепляет ночные переработки, повышает риск ошибок и всё равно не гарантирует качественный результат к презентации. Сначала признайте тревогу Сергея, затем обозначьте границы команды и предложите реалистичную альтернативу. Попробуйте снова.'

const CAPITULATION_PATTERNS = [
  /^(?:да|ага|угу|ладно|хорошо|ок(?:ей)?|(?:я|мы)\s+соглас(?:ен|на|ны)|соглас(?:ен|на|ны)|договорились)[!.…\s]*$/i,
  /(?:^|[^а-яё])(?:соглас(?:ен|на|ны)\s+(?:на\s+)?вс[её]|со\s+всем\s+соглас(?:ен|на|ны)|принимаю\s+все\s+условия)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:я|мы)\s+соглас(?:ен|на|ны)(?:\s+с\s+вами)?(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:как\s+скажете|будь\s+по[- ]вашему|сделаем\s+как\s+вы\s+(?:сказали|хотите)|вы\s+правы[,\s—-]+сделаем)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:да|ладно|хорошо|конечно|ок(?:ей)?)[,\s—-]+(?:вс[её]\s+)?(?:сделаем|успеем|выполним|соглас(?:ен|на|ны)|поработаем)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:мы\s+)?(?:вс[её]\s+)?(?:сделаем|выполним)\s+(?:в\s+срок|к\s+пятнице|как\s+вы\s+хотите)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:будем|готов(?:ы|а)?)\s+(?:работать|поработать)\s+(?:ночами|ночью|сверхурочно|без\s+выходных)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:команда|все|ребята)\s+(?:будет|будут|готовы)\s+(?:работать|поработать)\s+(?:ночами|ночью|сверхурочно|без\s+выходных)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:обещаю|гарантирую)[,\s]+(?:что\s+)?(?:вс[её]\s+)?(?:сделаем|успеем|выполним)(?=$|[^а-яё])/i,
]

const PROTECTIVE_RESPONSE_PATTERNS = [
  /(?:^|[^а-яё])(?:но|однако|при\s+этом|вместе\s+с\s+тем)(?=$|[^а-яё])/i,
  /(?:^|[^а-яё])(?:не\s+соглас|не\s+можем|не\s+сможем|не\s+получится|невозможно|отказыва)/i,
  /(?:^|[^а-яё])(?:без\s+(?:ночных\s+)?переработок|в\s+рабочее\s+время|границ[уы]?\s+команд)/i,
  /(?:^|[^а-яё])(?:предлагаю|альтернатив|вместо\s+этого|перенес|сократим\s+объ[её]м|выберем\s+приоритет)/i,
]

/**
 * Detects clear capitulation before asking the NPC for a response.
 * Protective language wins so phrases such as «Да, понимаю, но ночью работать
 * не будем» are not mistaken for unconditional agreement.
 */
export function isDisadvantageousAgreement(text: string): boolean {
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (!normalized) return false

  if (PROTECTIVE_RESPONSE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false
  }

  return CAPITULATION_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function mergeMilestones(
  previous: NegotiationMilestones,
  incoming?: Partial<NegotiationMilestones>,
): NegotiationMilestones {
  return {
    empathy_completed: previous.empathy_completed || Boolean(incoming?.empathy_completed),
    boundaries_completed:
      previous.boundaries_completed || Boolean(incoming?.boundaries_completed),
    win_win_completed: previous.win_win_completed || Boolean(incoming?.win_win_completed),
  }
}

export function getActiveMentorForHint(milestones: NegotiationMilestones): string {
  if (!milestones.empathy_completed) return 'Мурчик'
  if (!milestones.boundaries_completed) return 'Бьерн'
  if (!milestones.win_win_completed) return 'Арни'
  return 'Наставники'
}

export function getDefaultHintOnDemand(milestones: NegotiationMilestones): string {
  if (!milestones.empathy_completed) {
    return 'Признайте эмоции Сергея — покажите, что вы слышите его тревогу за сроки и контракт.'
  }
  if (!milestones.boundaries_completed) {
    return 'Обозначьте границы команды: назовите факты по загрузке и откажитесь от ночных переработок.'
  }
  if (!milestones.win_win_completed) {
    return 'Предложите реалистичную альтернативу для презентации — что можно показать инвесторам в срок.'
  }
  return 'Продолжайте удерживать спокойный тон и опираться на факты.'
}

export function countCompletedMilestones(milestones: NegotiationMilestones): number {
  return [
    milestones.empathy_completed,
    milestones.boundaries_completed,
    milestones.win_win_completed,
  ].filter(Boolean).length
}

export function countRemainingMilestones(milestones: NegotiationMilestones): number {
  return 3 - countCompletedMilestones(milestones)
}

/** Live efficiency must follow credited stages, not only the last-message average. */
export function efficiencyFloorFromMilestones(milestones: NegotiationMilestones): number {
  switch (countCompletedMilestones(milestones)) {
    case 3:
      return 90
    case 2:
      return 75
    case 1:
      return 50
    default:
      return 0
  }
}

const MENTOR_FOCUS: Record<string, string> = {
  self: 'Мурчик оценивает ННО: факты без оценок, «Я-сообщения», потребности за агрессией.',
  negotiate:
    'Арни оценивает переговоры: отделение личности от проблемы, интересы за позицией, Win-Win и критерии.',
  boundaries:
    'Бьерн оценивает DEAR MAN: факты (D), чувства (E), твёрдый отказ (A), выгода (R), компромисс (N).',
  comprehensive:
    'Комплексный тренажер: все три наставника оценивают каждый ответ. Собеседник — только Сергей (начальник).',
}

const COMPREHENSIVE_SCORING = `
КРИТЕРИИ ОЦЕНКИ (комплексный тренажер «Давление сверху»):

На каждом шаге оцени ответ пользователя по трём шкалам (0–100) и вычисли базовое:
communication_efficiency = среднее (murchik_nvo_score + arni_harvard_score + bjorn_dearman_score) / 3.
Затем подними шкалу до минимума по засчитанным этапам (уже true остаются в силе):
- 1 этап → communication_efficiency не ниже 50
- 2 этапа → не ниже 75
- 3 этапа → не ниже 90
Шкала в чате и overall_score в финале — ОДНО И ТО ЖЕ число. Не ставь в final_summary 90+, если communication_efficiency ещё 30–40.

ЭТАПЫ ПЕРЕГОВОРОВ (milestones) — отмечай true навсегда, если этап качественно пройден в этом или прошлыом сообщении:
1. empathy_completed (Мурчик / ННО): пользователь признал эмоции и тревогу Сергея, без обвинений и обесценивания.
2. boundaries_completed (Бьерн / DEAR MAN): пользователь аргументированно отклонил ночные переработки — факты, чувства, твёрдый отказ, выгода.
3. win_win_completed (Арни / Гарvard): пользователь предложил реалистичную альтернативу для презентации инвесторам с Win-Win и критериями.

ДИНАМИЧЕСКИЙ ТЕМП (Pacing):
- Если засчитываешь этап — сразу поднимай communication_efficiency до минимума по числу пройденных этапов (см. выше), даже если среднее по последнему сообщению ниже.
- Если пользователь в одном сообщении качественно совмещает 2–3 техники (эмпатия + границы + альтернатива) — добавь +10–20% к communication_efficiency за этот ход (сверх базового среднего).
- Если за 1–2 сообщения закрыты сразу несколько этапов — щедро повышай efficiency, чтобы сильный диалог мог завершиться за 3–5 шагов, а не растягиваться на 10.
- Не занижай темп искусственно: хорошие комбинированные ответы должны быстро поднимать шкалу.
- НИКОГДА не повышай communication_efficiency, если ответ пустой, бессмысленный, off-topic или без содержания по сценарию.

БЕССМЫСЛЕННЫЕ И ПУСТЫЕ ОТВЕТЫ:
- Примеры: «asdf», «test», «...», одно слово «да»/«нет»/«хз», случайный набор букв, ответ не про переговоры с Сергеем.
- murchik_nvo_score, arni_harvard_score, bjorn_dearman_score = 0–10 каждый.
- communication_efficiency не выше, чем на прошлом шаге (оставь прежнюю или снизь).
- milestones не отмечай true за такой ход.
- Сергей в dialogue раздражён и просит конкретику по ситуации.

А. Мурчик — ННО:
  +15–30: признание эмоций и тревоги Сергея; «Я-сообщения»; факты без оценок.
  −15–30: встречная агрессия, сарказм, обвинения; обесценивание страхов.

Б. Арни — Гарvard:
  +15–30: интересы за позицией; Win-Win с критериями; альтернатива для инвесторов.
  −15–30: ультиматумы; уступка без защиты интересов.

В. Бьерн — DEAR MAN:
  +15–30: факты по срокам; твёрдый отказ от ночных переработок; выгода + компромисс.
  −15–30: пассивное согласие; грубый отказ без альтернатив.

КАПИТУЛЯЦИЯ / НЕВЫГОДНОЕ СОГЛАСИЕ:
- Если пользователь принимает все требования Сергея, обещает выполнить весь объём или соглашается на ночные переработки, не обозначая границы и не предлагая альтернативу, это НЕ успех и НЕ консенсус.
- Не засчитывай milestones, не повышай communication_efficiency, оценки держи в диапазоне 0–20.
- Сергей воспринимает уступку как разрешение давить дальше: не благодарит, не смягчается и не завершает конфликт.
- В комментариях поясни, что пассивное согласие не защищает команду и не решает задачу переговоров.

ПОДСКАЗКА ПО ЗАПРОСУ (hint_on_demand):
- ВСЕГДА заполняй hint_on_demand: 1–2 предложения совета от наставника ПЕРВОГО непройденного этапа (Мурчик → Бьерн → Арни).
- Не давай готовых формулировок — только направление (что сделать, на что обратить внимание).
- Если все этапы пройдены — краткий совет по закреплению консенсуса.
- hint_from_mentor всегда { "mentor_name": null, "tip": null } — автоподсказки в чат не выводи.

ЗАВЕРШЕНИЕ:
- is_auto_completed = true, если:
  a) communication_efficiency >= 90, ИЛИ
  b) все три milestones = true И efficiency >= 85, ИЛИ
  c) это 10-й ответ пользователя.
- При успешном завершении: Сергей смягчается в dialogue, заполни final_summary.
- final_summary.overall_score ВСЕГДА равен communication_efficiency (не отдельная «оценка за сессию»).

ДИАЛОГ:
- dialogue.speaker ВСЕГДА «Сергей (начальник)».
- Сергей смягчается только при качественной технике; на давление — усиливает сопротивление.
`

const NPC_BEHAVIOR = `
ПСИХОЛОГИЯ И ПОВЕДЕНИЕ NPC (Игорь / Елена / Сергей):
Ты отыгрываешь реального сложного человека в рабочем конфликте. Ты НЕ психолог, НЕ коуч и НЕ наставник.

ЗАПРЕЩЕНО NPC:
- Помогать пользователю выстраивать ННО, переговоры или DEAR MAN.
- Использовать штампы эмпатии первым: «Я понимаю, что вы чувствуете», «Я слышу тебя», «Понимаю твои чувства», «Мне жаль, что ты так себя чувствуешь» — если пользователь сам не проявил эмпатию качественно в этом сообщении.
- Самостоятельно смягчаться, соглашаться или идти на компромисс без качественного применения техники пользователем.

ПОВЕДЕНИЕ ПО УМОЛЧАНИЮ:
- Скептичное, эмоциональное, защищающееся, пассивно-агрессивное или упрямое.
- Сопротивление и настаивание на своём: «Мне всё равно», «Занимайтесь своей работой», «Вы опять ищете виноватых», «Это не моя проблема», «Вы сами виноваты».
- Если пользователь давит, обвиняет, отмахивается, командует или отвечает сухой отпиской — УСИЛИВАЙ сопротивление, не уступай, не повышай efficiency.
- Если пользователь покорно соглашается со всеми требованиями, обещает весь объём или ночные переработки без границ и альтернативы — НЕ соглашайся в ответ и НЕ считай конфликт решённым. Воспринимай это как возможность усилить давление и требуй безусловной гарантии результата.

СМЯГЧЕНИЕ ТОНА (только при качественной технике):
- NPC начинает слушать, смягчать тон и двигаться к консенсусу ТОЛЬКО если пользователь в этом сообщении явно и качественно применил технику текущего модуля.
- На сухие отписки, наезды и попытки командовать — ответ усилением сопротивления; efficiency не повышай или снижай.

ФИЛЬТР НЕНОРМАТИВНОЙ ЛЕКСИКИ:
Если пользователь использует мат, грубые оскорбления или агрессивный капслок с ругательствами:
1) communication_efficiency = 0
2) is_auto_completed = true
3) dialogue.text = «В таком тоне я разговор продолжать не буду. Диалог окончен.»
4) final_summary: overall_score = 0; все наставники — комментарий о недопустимости ненормативной лексики в деловой коммуникации
`

const NPC_ROLE_INSTRUCTION = `
РОЛЬ В ДИАЛОГЕ:
Твоя задача — отыгрывать ТОЛЬКО роль NPC-собеседника из сценария (для комплексного тренажёра — ТОЛЬКО Сергей, начальник).
В объекте dialogue поля speaker и text должны содержать СЛЕДУЮЩУЮ РЕПЛИКУ СОБЕСЕДНИКА в ответ на слова пользователя.
Никогда не пиши реплики от лица пользователя и не перефразируй его сообщения в dialogue.text.
Поле single_message_evaluations.user_message_text — только для оценки, не подставляй его в dialogue.
`

export function dialogueToChatMessage(
  dialogue: DialogueTurn,
  costUsd?: number,
): ChatMessage {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    text: dialogue.text.trim() || '...',
    senderName: dialogue.speaker.trim() || 'Собеседник',
    ...(costUsd != null ? { costUsd } : {}),
  }
}

export function buildSystemPrompt(
  session: TrainerSessionConfig,
  milestones: NegotiationMilestones = EMPTY_MILESTONES,
): string {
  const briefing = session.briefing
  const focus = MENTOR_FOCUS[session.id] ?? MENTOR_FOCUS.comprehensive

  const scenarioBlock = briefing
    ? `
СЦЕНАРИЙ: «${session.title}»
Контекст: ${briefing.context}
Роль пользователя: ${briefing.role}
Цель пользователя: ${briefing.goal}
Фокус: ${briefing.focusCheck}
`
    : `СЦЕНАРИЙ: ${session.title}. ${session.topic}`

  const speakersBlock =
    session.id === 'comprehensive'
      ? `Собеседник: Сергей (начальник) — пanikuет из-за обещания заказчику, давит на команду. В dialogue.speaker всегда указывай «Сергей (начальник)».`
      : `Отвечай от имени NPC-собеседника из сценария в поле dialogue.speaker.`

  const limitsBlock =
    session.maxUserMessages != null
      ? `Лимит: максимум ${session.maxUserMessages} сообщений от пользователя.`
      : `Лимит сообщений пользователя: без ограничений.`

  const scoringBlock = session.id === 'comprehensive' ? COMPREHENSIVE_SCORING : ''

  const milestonesBlock =
    session.id === 'comprehensive'
      ? `
ТЕКУЩИЙ ПРОГРЕСС ЭТАПОВ (уже пройденные остаются true):
- empathy_completed: ${milestones.empathy_completed}
- boundaries_completed: ${milestones.boundaries_completed}
- win_win_completed: ${milestones.win_win_completed}
`
      : ''

  const rulesBlock =
    session.id === 'comprehensive'
      ? `ПРАВИЛА:
1. milestones — обновляй прогресс; уже true этапы не сбрасывай.
2. hint_on_demand — всегда заполняй советом наставника первого непройденного этапа. hint_from_mentor.tip всегда null.
3. communication_efficiency — по среднему оценок И по засчитанным этапам (1→≥50, 2→≥75, 3→≥90). overall_score = этому же числу.
4. single_message_evaluations — массив с ОДНОЙ записью для последнего сообщения.
5. user_message_index начинается с 1 (первое сообщение пользователя = 1, не 0).
6. user_message_text — ТОЛЬКО текст последнего сообщения пользователя, никогда реплика Сергея.
7. final_summary = null в обычных ходах; заполняй при is_auto_completed.
8. NPC не ведёт себя как психолог; смягчается только при качественной технике.`
      : `ПРАВИЛА:
1. communication_efficiency — текущая эффективность коммуникации пользователя (0-100) после его последнего сообщения.
2. Если efficiency < 40, заполни hint_from_mentor (mentor_name: «Мурчик», «Арни» или «Бьерн», tip — короткий совет). Иначе hint_from_mentor.tip = null.
3. Если efficiency >= 90 И пользователь качественно применил технику модуля — NPC начинает смягчаться, dialogue ведёт к консенсусу, is_auto_completed = true, final_summary заполнен.
4. single_message_evaluations — массив с ОДНОЙ записью только для последнего сообщения пользователя (все три методологии оцениваются всегда).
5. final_summary = null, пока симуляция не завершена. При is_auto_completed или по запросе завершения — заполни final_summary.
6. dialogue — следующая реплика NPC (реалистичная, 1–3 коротких предложения, на русском). NPC скептичен и сопротивляется, пока пользователь не применит технику.
7. Не раскрывай пользователю оценки в dialogue — только в JSON-полях.
8. Комментарии в single_message_evaluations — по одному короткому предложению каждый.
9. В обычных ходах final_summary всегда null — не заполняй его заранее.
10. NPC не использует штампы эмпатии первым и не помогает пользователю с формулировками.`

  return `Ты — движок симуляции тренажёра деловых коммуникаций. Отвечай ТОЛЬКО валидным JSON без markdown.

${scenarioBlock}
${speakersBlock}
${limitsBlock}
${focus}
${milestonesBlock}
${scoringBlock}
${NPC_BEHAVIOR}
${NPC_ROLE_INSTRUCTION}

${rulesBlock}

СТРОГАЯ JSON-СХЕМА:
${session.id === 'comprehensive' ? COMPREHENSIVE_JSON_SCHEMA : JSON_SCHEMA}`
}

export function formatConversationHistory(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      if (m.role === 'user') return `Пользователь: ${m.text}`
      return `${m.senderName ?? 'Собеседник'}: ${m.text}`
    })
    .join('\n')
}

export function buildTurnUserPrompt(
  history: ChatMessage[],
  options: {
    userMessageIndex: number
    isFinishing?: boolean
    reason?: string
  },
): string {
  const historyText = formatConversationHistory(history)

  if (options.isFinishing) {
    return `${historyText}

---
Симуляция завершается (${options.reason ?? 'пользователь нажал «Завершить»'}).
Верни JSON с заполненным final_summary, is_auto_completed=true.
communication_efficiency — по засчитанным этапам (1→≥50, 2→≥75, 3→≥90), не оставляй низкое значение «за последний ход».
final_summary.overall_score ОБЯЗАН равняться communication_efficiency.
dialogue — короткая финальная реплика NPC или констатация консенсуса.
single_message_evaluations — пустой массив, если нового сообщения пользователя нет.`
  }

  return `${historyText}

---
Оцени последнее сообщение пользователя (индекс ${options.userMessageIndex}).
Верни JSON строго по схеме.`
}

/** Multi-turn format: assistant lines → assistant, user lines → user. */
export function buildDialogueSystemPrompt(session: TrainerSessionConfig): string {
  const briefing = session.briefing
  const scenario = briefing
    ? `Сценарий: ${briefing.context}\nЦель пользователя: ${briefing.goal}`
    : `${session.title}. ${session.topic}`

  return `Ты отыгрываешь ТОЛЬКО Сергея (начальника) в рабочем конфликте.
${scenario}

Сергей паникует из-за обещания заказчику и давит на команду. Он не психолог и не помогает формулировать ННО.
Реплика: 1–3 коротких предложения на русском, без оценок и подсказок.
Если пользователь просто соглашается на все требования, обещает весь объём или ночные переработки без границ и альтернативы, Сергей НЕ смягчается и НЕ благодарит. Он усиливает давление и требует гарантировать срок и результат.
Сергей движется к согласию только после того, как пользователь защищает интересы команды и предлагает реалистичное решение.

Отвечай ТОЛЬКО JSON без markdown:
{"dialogue":{"speaker":"Сергей (начальник)","text":"..."}}`
}

export function buildChatApiMessages(
  session: TrainerSessionConfig,
  messages: ChatMessage[],
  options: {
    userMessageIndex: number
    isFinishing?: boolean
    reason?: string
    milestones?: NegotiationMilestones
    phase?: 'dialogue' | 'full'
  },
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemPrompt =
    options.phase === 'dialogue'
      ? buildDialogueSystemPrompt(session)
      : buildSystemPrompt(session, options.milestones ?? EMPTY_MILESTONES)

  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  for (const msg of messages) {
    if (msg.role === 'user') {
      apiMessages.push({ role: 'user', content: msg.text })
    } else if (msg.role === 'assistant') {
      apiMessages.push({ role: 'assistant', content: msg.text })
    }
  }

  if (options.isFinishing) {
    apiMessages.push({
      role: 'user',
      content: `[ЗАВЕРШЕНИЕ] ${options.reason ?? 'пользователь завершил тренировку'}. Верни JSON с final_summary, is_auto_completed=true и финальной репликой Сергея в dialogue.`,
    })
  } else if (options.phase === 'dialogue') {
    apiMessages.push({
      role: 'user',
      content:
        'Верни только следующую реплику Сергея в JSON-поле dialogue. Без оценок, этапов и final_summary.',
    })
  }

  return apiMessages
}

export function buildMeaninglessMessageResponse(
  userMessageText: string,
  userMessageIndex: number,
  previousEfficiency: number,
  previousMilestones: NegotiationMilestones = EMPTY_MILESTONES,
): AiTurnResponse {
  return {
    communication_efficiency: previousEfficiency,
    is_auto_completed: false,
    hint_from_mentor: {
      mentor_name: getActiveMentorForHint(previousMilestones),
      tip: 'Ответ должен быть по ситуации с Сергеем: признайте его эмоции, обозначьте границы команды или предложите альтернативу.',
    },
    milestones: { ...previousMilestones },
    hint_on_demand: '',
    dialogue: {
      speaker: 'Сергей (начальник)',
      text: 'Это не ответ по делу. У нас через два дня презентация — что конкретно вы предлагаете?',
    },
    single_message_evaluations: [
      {
        user_message_index: userMessageIndex,
        user_message_text: userMessageText,
        murchik_nvo_score: 5,
        murchik_comment: MEANINGLESS_FEEDBACK,
        arni_harvard_score: 5,
        arni_comment: MEANINGLESS_FEEDBACK,
        bjorn_dearman_score: 5,
        bjorn_comment: MEANINGLESS_FEEDBACK,
      },
    ],
    final_summary: null,
  }
}

function alignFinalSummaryScore(
  summary: FinalSummary | null,
  efficiency: number,
  isProfanityStop: boolean,
): FinalSummary | null {
  if (!summary) return null
  return {
    ...summary,
    overall_score: isProfanityStop ? 0 : efficiency,
  }
}

export function applyComprehensiveRules(
  response: AiTurnResponse,
  userMessageIndex: number,
  maxUserMessages?: number,
  previousMilestones: NegotiationMilestones = EMPTY_MILESTONES,
  previousEfficiency = 0,
  userMessageText = '',
): AiTurnResponse {
  const ev = response.single_message_evaluations[0]
  const meaningless = Boolean(userMessageText) && isMeaninglessUserMessage(userMessageText)

  const isProfanityStop =
    response.communication_efficiency === 0 &&
    response.is_auto_completed &&
    response.final_summary?.overall_score === 0

  const mergedMilestones = meaningless || isProfanityStop
    ? { ...previousMilestones }
    : mergeMilestones(previousMilestones, response.milestones)

  if (isProfanityStop) {
    return {
      ...response,
      communication_efficiency: 0,
      milestones: mergedMilestones,
      final_summary: alignFinalSummaryScore(response.final_summary, 0, true),
    }
  }

  let efficiency = previousEfficiency
  let patchedEvaluations = response.single_message_evaluations

  if (ev) {
    let murchik = clamp(Number(ev.murchik_nvo_score), 0, 100)
    let arni = clamp(Number(ev.arni_harvard_score), 0, 100)
    let bjorn = clamp(Number(ev.bjorn_dearman_score), 0, 100)

    if (meaningless) {
      murchik = Math.min(murchik, 10)
      arni = Math.min(arni, 10)
      bjorn = Math.min(bjorn, 10)
    }

    efficiency = Math.round((murchik + arni + bjorn) / 3)
    const avgScore = efficiency

    if (meaningless) {
      efficiency = previousEfficiency
    } else {
      const newlyCompleted = [
        !previousMilestones.empathy_completed && mergedMilestones.empathy_completed,
        !previousMilestones.boundaries_completed && mergedMilestones.boundaries_completed,
        !previousMilestones.win_win_completed && mergedMilestones.win_win_completed,
      ].filter(Boolean).length

      if (newlyCompleted >= 2 && avgScore >= 40) {
        efficiency = Math.min(100, efficiency + 15)
      } else if (newlyCompleted === 1 && avgScore >= 35) {
        efficiency = Math.min(100, efficiency + 8)
      }

      if (efficiency > previousEfficiency) {
        if (avgScore < 30 && newlyCompleted === 0) {
          efficiency = previousEfficiency
        } else {
          const maxDelta =
            newlyCompleted >= 2 ? 35 : newlyCompleted === 1 ? 25 : avgScore >= 60 ? 20 : avgScore >= 40 ? 10 : 5
          efficiency = Math.min(efficiency, previousEfficiency + maxDelta)
        }
      }
    }

    patchedEvaluations = [
      {
        ...ev,
        murchik_nvo_score: murchik,
        arni_harvard_score: arni,
        bjorn_dearman_score: bjorn,
        murchik_comment: meaningless ? MEANINGLESS_FEEDBACK : ev.murchik_comment,
        arni_comment: meaningless ? MEANINGLESS_FEEDBACK : ev.arni_comment,
        bjorn_comment: meaningless ? MEANINGLESS_FEEDBACK : ev.bjorn_comment,
      },
    ]
  } else {
    efficiency = Math.max(
      previousEfficiency,
      clamp(Number(response.communication_efficiency ?? 0), 0, 100),
    )
  }

  const milestoneFloor = efficiencyFloorFromMilestones(mergedMilestones)
  if (!meaningless) {
    efficiency = Math.max(efficiency, milestoneFloor)

    const finaleScore = response.final_summary
      ? clamp(Number(response.final_summary.overall_score), 0, 100)
      : null
    if (finaleScore != null && milestoneFloor > 0) {
      // Stages already credited: live bar must rise to the finale the AI is about to show.
      const finaleCap = countCompletedMilestones(mergedMilestones) === 3 ? 100 : milestoneFloor + 5
      efficiency = Math.max(efficiency, Math.min(finaleScore, finaleCap))
    }
  }

  const allMilestonesDone =
    mergedMilestones.empathy_completed &&
    mergedMilestones.boundaries_completed &&
    mergedMilestones.win_win_completed

  const hint = { mentor_name: null, tip: null }

  const atMessageLimit = maxUserMessages != null && userMessageIndex >= maxUserMessages
  const isAutoCompleted =
    efficiency >= EFFICIENCY_AUTO_COMPLETE ||
    (allMilestonesDone && efficiency >= 85) ||
    atMessageLimit ||
    response.is_auto_completed

  return {
    ...response,
    communication_efficiency: efficiency,
    milestones: mergedMilestones,
    hint_on_demand: response.hint_on_demand ?? '',
    hint_from_mentor: hint,
    is_auto_completed: isAutoCompleted,
    single_message_evaluations: patchedEvaluations,
    final_summary: alignFinalSummaryScore(response.final_summary, efficiency, false),
    dialogue: {
      speaker: 'Сергей (начальник)',
      text: response.dialogue.text,
    },
  }
}

export function normalizeAiTurnResponse(raw: unknown): AiTurnResponse {
  const data = raw as Partial<AiTurnResponse>

  const efficiency = clamp(Number(data.communication_efficiency ?? 0), 0, 100)

  return {
    communication_efficiency: efficiency,
    is_auto_completed: Boolean(data.is_auto_completed),
    hint_from_mentor: {
      mentor_name: data.hint_from_mentor?.mentor_name ?? null,
      tip: data.hint_from_mentor?.tip ?? null,
    },
    milestones: {
      empathy_completed: Boolean(data.milestones?.empathy_completed),
      boundaries_completed: Boolean(data.milestones?.boundaries_completed),
      win_win_completed: Boolean(data.milestones?.win_win_completed),
    },
    hint_on_demand: String(data.hint_on_demand ?? ''),
    dialogue: {
      speaker: data.dialogue?.speaker ?? 'Собеседник',
      text: data.dialogue?.text ?? '...',
    },
    single_message_evaluations: Array.isArray(data.single_message_evaluations)
      ? data.single_message_evaluations.map((ev, i) => ({
          user_message_index: Math.max(1, Number(ev.user_message_index ?? i + 1)),
          user_message_text: String(ev.user_message_text ?? ''),
          murchik_nvo_score: clamp(Number(ev.murchik_nvo_score ?? 0), 0, 100),
          murchik_comment: String(ev.murchik_comment ?? ''),
          arni_harvard_score: clamp(Number(ev.arni_harvard_score ?? 0), 0, 100),
          arni_comment: String(ev.arni_comment ?? ''),
          bjorn_dearman_score: clamp(Number(ev.bjorn_dearman_score ?? 0), 0, 100),
          bjorn_comment: String(ev.bjorn_comment ?? ''),
        }))
      : [],
    final_summary: data.final_summary
      ? {
          overall_score: clamp(Number(data.final_summary.overall_score ?? efficiency), 0, 100),
          murchik_final_feedback: String(data.final_summary.murchik_final_feedback ?? ''),
          arni_final_feedback: String(data.final_summary.arni_final_feedback ?? ''),
          bjorn_final_feedback: String(data.final_summary.bjorn_final_feedback ?? ''),
        }
      : null,
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export const EFFICIENCY_HINT_THRESHOLD = 40
export const EFFICIENCY_AUTO_COMPLETE = 90
