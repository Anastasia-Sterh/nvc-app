export interface ChoiceOption {
  id: string
  text: string
  correct: boolean
  feedback: string
}

export interface TrainingStep {
  id: number
  title: string
  messages: string[]
  question?: string
  options?: ChoiceOption[]
  /** Текст основной кнопки на этом шаге (по умолчанию «Ага!») */
  continueLabel?: string
  /** Финальный шаг: реплика + кнопки «Пройти заново» / «В меню» */
  isFinale?: boolean
}

export interface TrainingTheme {
  progressFrom: string
  progressTo: string
  bubbleFrom: string
  bubbleTo: string
  bubbleTail: string
  stepLabel: string
  titleAccent: string
  buttonFrom: string
  buttonVia: string
  buttonTo: string
  buttonText: string
}

export interface TrainingModuleConfig {
  id: string
  title: string
  steps: TrainingStep[]
  theme: TrainingTheme
  complete?: {
    emoji: string
    message: string
  }
}
