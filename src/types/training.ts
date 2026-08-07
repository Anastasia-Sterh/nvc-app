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
}
