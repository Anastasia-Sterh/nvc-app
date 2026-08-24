import {
  applyComprehensiveRules,
  buildChatApiMessages,
  dialogueToChatMessage,
  normalizeAiTurnResponse,
} from './trainerSimulation'
import {
  buildProfanityHardStopResponse,
  containsProfanityOrAbuse,
} from './profanityFilter'
import { chatCompletion, DEFAULT_MODEL, parseAiJsonResponse } from './openRouter'
import type {
  AiTurnResponse,
  ChatMessage,
  FinalSummary,
  NegotiationMilestones,
  SimulationEndReason,
  SimulationResult,
  SingleMessageEvaluation,
  TrainerSessionConfig,
} from '../types/trainer'

export async function runSimulationTurn(
  apiKey: string,
  session: TrainerSessionConfig,
  messages: ChatMessage[],
  options: {
    userMessageIndex: number
    isFinishing?: boolean
    endReason?: SimulationEndReason
    model?: string
    milestones?: NegotiationMilestones
  },
): Promise<AiTurnResponse> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')

  if (
    lastUserMessage &&
    !options.isFinishing &&
    containsProfanityOrAbuse(lastUserMessage.text)
  ) {
    return buildProfanityHardStopResponse(
      session,
      lastUserMessage.text,
      options.userMessageIndex,
    )
  }

  const apiMessages = buildChatApiMessages(session, messages, {
    userMessageIndex: options.userMessageIndex,
    isFinishing: options.isFinishing,
    milestones: options.milestones,
    reason:
      options.endReason === 'max_messages'
        ? 'достигнут лимит сообщений'
        : options.endReason === 'auto'
          ? 'достигнута высокая эффективность коммуникации'
          : 'пользователь завершил тренировку',
  })

  const completion = await chatCompletion(apiKey, apiMessages, {
    model: options.model ?? DEFAULT_MODEL,
    maxTokens: options.isFinishing
      ? 1800
      : session.id === 'comprehensive'
        ? 1400
        : 900,
  })

  let parsed = normalizeAiTurnResponse(parseAiJsonResponse(completion.content))
  parsed.requestCostUsd = completion.costUsd

  if (session.id === 'comprehensive') {
    parsed = applyComprehensiveRules(
      parsed,
      options.userMessageIndex,
      session.maxUserMessages,
      options.milestones,
    )
  }

  if (
    lastUserMessage &&
    parsed.dialogue.text.trim() === lastUserMessage.text.trim()
  ) {
    throw new Error(
      'ИИ вернул эхо вашего сообщения вместо реплики собеседника. Попробуйте отправить ещё раз.',
    )
  }

  dialogueToChatMessage(parsed.dialogue)

  return parsed
}

export function mergeEvaluations(
  existing: SingleMessageEvaluation[],
  incoming: SingleMessageEvaluation[],
): SingleMessageEvaluation[] {
  const map = new Map<number, SingleMessageEvaluation>()
  for (const ev of existing) {
    if (ev.user_message_index >= 1) map.set(ev.user_message_index, ev)
  }
  for (const ev of incoming) {
    if (ev.user_message_index >= 1) map.set(ev.user_message_index, ev)
  }
  return [...map.values()].sort((a, b) => a.user_message_index - b.user_message_index)
}

/** Keep only real user turns; replace AI-echoed bot text with actual user messages. */
export function sanitizeMessageEvaluations(
  messages: ChatMessage[],
  evaluations: SingleMessageEvaluation[],
): SingleMessageEvaluation[] {
  const userMessages = messages.filter((m) => m.role === 'user')
  const assistantTexts = new Set(
    messages.filter((m) => m.role === 'assistant').map((m) => m.text.trim()),
  )

  const seen = new Set<number>()
  const result: SingleMessageEvaluation[] = []

  for (const ev of evaluations) {
    if (ev.user_message_index < 1 || seen.has(ev.user_message_index)) continue

    const userMsg = userMessages[ev.user_message_index - 1]
    if (!userMsg) continue

    const text = userMsg.text.trim()
    if (!text || assistantTexts.has(text)) continue

    seen.add(ev.user_message_index)
    result.push({ ...ev, user_message_text: text })
  }

  return result.sort((a, b) => a.user_message_index - b.user_message_index)
}

export function buildSimulationResult(
  endReason: SimulationEndReason,
  finalEfficiency: number,
  evaluations: SingleMessageEvaluation[],
  finalSummary: FinalSummary | null,
  session: TrainerSessionConfig,
  messages: ChatMessage[] = [],
): SimulationResult {
  const fallbackSummary: FinalSummary = {
    overall_score: finalEfficiency || session.debrief.score,
    murchik_final_feedback: session.debrief.tips[0] ?? session.debrief.summary,
    arni_final_feedback: session.debrief.tips[1] ?? session.debrief.summary,
    bjorn_final_feedback: session.debrief.tips[2] ?? session.debrief.mentorQuote,
  }

  return {
    endReason,
    finalEfficiency,
    finalSummary: finalSummary ?? fallbackSummary,
    messageEvaluations: sanitizeMessageEvaluations(messages, evaluations),
  }
}
