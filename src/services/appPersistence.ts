import type { GoalId } from '../data/learningGoals'
import { getTrainingModule } from '../data/trainingModules'
import { getTrainerSession } from '../data/trainerSessions'
import type {
  ChatMessage,
  HintFromMentor,
  NegotiationMilestones,
  SimulationResult,
  SingleMessageEvaluation,
  TrainerId,
} from '../types/trainer'
import { EMPTY_MILESTONES } from '../types/trainer'

export type PersistedScreen =
  | 'menu'
  | 'training'
  | 'briefing'
  | 'chat'
  | 'debrief'
  | 'coming-soon'

export interface TrainingProgress {
  stepIndex: number
  messageIndex: number
  showQuiz: boolean
  selectedOptionId: string | null
  isComplete: boolean
}

export interface NavigationState {
  screen: PersistedScreen
  activeGoalId: GoalId | null
  activeTrainerId: TrainerId | null
  simulationResult: SimulationResult | null
}

export interface ChatSessionState {
  trainerId: TrainerId
  messages: ChatMessage[]
  efficiency: number
  mentorHint: HintFromMentor | null
  evaluations: SingleMessageEvaluation[]
  milestones: NegotiationMilestones
  hintOnDemand: string
  hintsRemaining: number
  goalModalSeen: boolean
}

const NAV_KEY = 'nvc-navigation'
const TRAINING_KEY = 'nvc-training-progress'
const CHAT_KEY = 'nvc-chat-session'

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isGoalId(value: unknown): value is GoalId {
  return value === 'self' || value === 'negotiate' || value === 'boundaries'
}

function isTrainerId(value: unknown): value is TrainerId {
  return value === 'comprehensive'
}

export function readTrainingProgress(goalId: GoalId): TrainingProgress | null {
  const all = safeParse<Record<string, TrainingProgress>>(localStorage.getItem(TRAINING_KEY))
  if (!all || typeof all !== 'object') return null

  const progress = all[goalId]
  if (!progress || typeof progress !== 'object') return null

  const {
    stepIndex,
    messageIndex,
    showQuiz,
    selectedOptionId,
    isComplete,
  } = progress

  if (
    typeof stepIndex !== 'number' ||
    typeof messageIndex !== 'number' ||
    typeof showQuiz !== 'boolean' ||
    typeof isComplete !== 'boolean' ||
    (selectedOptionId !== null && typeof selectedOptionId !== 'string')
  ) {
    return null
  }

  return { stepIndex, messageIndex, showQuiz, selectedOptionId, isComplete }
}

export function writeTrainingProgress(goalId: GoalId, progress: TrainingProgress): void {
  const all =
    safeParse<Record<string, TrainingProgress>>(localStorage.getItem(TRAINING_KEY)) ?? {}
  all[goalId] = progress
  localStorage.setItem(TRAINING_KEY, JSON.stringify(all))
}

export function clearTrainingProgress(goalId: GoalId): void {
  const all =
    safeParse<Record<string, TrainingProgress>>(localStorage.getItem(TRAINING_KEY)) ?? {}
  delete all[goalId]
  localStorage.setItem(TRAINING_KEY, JSON.stringify(all))
}

export function readChatSession(trainerId: TrainerId): ChatSessionState | null {
  const saved = safeParse<ChatSessionState>(localStorage.getItem(CHAT_KEY))
  if (!saved || saved.trainerId !== trainerId) return null
  if (!Array.isArray(saved.messages) || saved.messages.length === 0) return null

  return {
    trainerId: saved.trainerId,
    messages: saved.messages,
    efficiency: typeof saved.efficiency === 'number' ? saved.efficiency : 0,
    mentorHint: saved.mentorHint ?? null,
    evaluations: Array.isArray(saved.evaluations) ? saved.evaluations : [],
    milestones: saved.milestones ?? EMPTY_MILESTONES,
    hintOnDemand: typeof saved.hintOnDemand === 'string' ? saved.hintOnDemand : '',
    hintsRemaining:
      typeof saved.hintsRemaining === 'number' ? saved.hintsRemaining : 3,
    goalModalSeen: Boolean(saved.goalModalSeen),
  }
}

export function writeChatSession(state: ChatSessionState): void {
  localStorage.setItem(CHAT_KEY, JSON.stringify(state))
}

export function clearChatSession(): void {
  localStorage.removeItem(CHAT_KEY)
}

export function readNavigation(): NavigationState | null {
  const saved = safeParse<NavigationState>(localStorage.getItem(NAV_KEY))
  if (!saved || typeof saved !== 'object') return null

  const { screen, activeGoalId, activeTrainerId, simulationResult } = saved

  if (
    screen !== 'menu' &&
    screen !== 'training' &&
    screen !== 'briefing' &&
    screen !== 'chat' &&
    screen !== 'debrief' &&
    screen !== 'coming-soon'
  ) {
    return null
  }

  if (activeGoalId !== null && !isGoalId(activeGoalId)) return null
  if (activeTrainerId !== null && !isTrainerId(activeTrainerId)) return null

  return {
    screen,
    activeGoalId: activeGoalId ?? null,
    activeTrainerId: activeTrainerId ?? null,
    simulationResult: simulationResult ?? null,
  }
}

export function validateNavigation(state: NavigationState): NavigationState | null {
  switch (state.screen) {
    case 'menu':
      return { screen: 'menu', activeGoalId: null, activeTrainerId: null, simulationResult: null }

    case 'training':
      if (state.activeGoalId && getTrainingModule(state.activeGoalId)) {
        return { ...state, activeTrainerId: null, simulationResult: null }
      }
      return null

    case 'briefing':
      if (
        state.activeTrainerId &&
        getTrainerSession(state.activeTrainerId)?.briefing
      ) {
        if (readChatSession(state.activeTrainerId)) {
          return { ...state, screen: 'chat', activeGoalId: null, simulationResult: null }
        }
        return { ...state, activeGoalId: null, simulationResult: null }
      }
      return null

    case 'chat':
      if (state.activeTrainerId && getTrainerSession(state.activeTrainerId)) {
        return { ...state, activeGoalId: null, simulationResult: null }
      }
      return null

    case 'debrief':
      if (
        state.activeTrainerId &&
        getTrainerSession(state.activeTrainerId) &&
        state.simulationResult
      ) {
        return { ...state, activeGoalId: null }
      }
      return null

    case 'coming-soon':
      return { screen: 'coming-soon', activeGoalId: null, activeTrainerId: null, simulationResult: null }

    default:
      return null
  }
}

export function getInitialNavigation(): NavigationState {
  const saved = readNavigation()
  if (!saved) {
    return {
      screen: 'menu',
      activeGoalId: null,
      activeTrainerId: null,
      simulationResult: null,
    }
  }

  return (
    validateNavigation(saved) ?? {
      screen: 'menu',
      activeGoalId: null,
      activeTrainerId: null,
      simulationResult: null,
    }
  )
}

export function writeNavigation(state: NavigationState): void {
  localStorage.setItem(NAV_KEY, JSON.stringify(state))
}

export function writeMenuNavigation(): void {
  writeNavigation({
    screen: 'menu',
    activeGoalId: null,
    activeTrainerId: null,
    simulationResult: null,
  })
}
