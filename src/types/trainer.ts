import type { GoalId } from '../data/learningGoals'

export type TrainerId = GoalId | 'comprehensive'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  senderName?: string
  /** OpenRouter charge for this AI reply, in USD */
  costUsd?: number
}

export interface TrainerBriefing {
  context: string
  role: string
  goal: string
  focusCheck: string
}

export interface TrainerSessionConfig {
  id: TrainerId
  title: string
  topic: string
  mentorLabel: string
  maxUserMessages?: number
  briefing?: TrainerBriefing
  initialMessages: ChatMessage[]
  debrief: {
    score: number
    summary: string
    tips: string[]
    mentorQuote: string
  }
}

export interface HintFromMentor {
  mentor_name: string | null
  tip: string | null
}

export interface DialogueTurn {
  speaker: string
  text: string
}

export interface SingleMessageEvaluation {
  user_message_index: number
  user_message_text: string
  murchik_nvo_score: number
  murchik_comment: string
  arni_harvard_score: number
  arni_comment: string
  bjorn_dearman_score: number
  bjorn_comment: string
}

export interface FinalSummary {
  overall_score: number
  murchik_final_feedback: string
  arni_final_feedback: string
  bjorn_final_feedback: string
}

export interface AiTurnResponse {
  communication_efficiency: number
  is_auto_completed: boolean
  hint_from_mentor: HintFromMentor
  dialogue: DialogueTurn
  single_message_evaluations: SingleMessageEvaluation[]
  final_summary: FinalSummary | null
  requestCostUsd?: number
}

export type SimulationEndReason = 'manual' | 'auto' | 'max_messages'

export interface SimulationResult {
  endReason: SimulationEndReason
  finalEfficiency: number
  finalSummary: FinalSummary
  messageEvaluations: SingleMessageEvaluation[]
}
