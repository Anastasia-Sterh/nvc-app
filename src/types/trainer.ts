import type { GoalId } from '../data/learningGoals'

export type TrainerId = GoalId | 'comprehensive'

export interface ChatMessage {
  id: string
  role: 'user' | 'mentor' | 'partner'
  text: string
  senderName?: string
}

export interface TrainerSessionConfig {
  id: TrainerId
  title: string
  topic: string
  mentorLabel: string
  initialMessages: ChatMessage[]
  debrief: {
    score: number
    summary: string
    tips: string[]
    mentorQuote: string
  }
}
