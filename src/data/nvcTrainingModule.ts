import type { TrainingModuleConfig } from '../types/training'
import { trainingSteps } from './trainingSteps'

export const nvcTrainingModule: TrainingModuleConfig = {
  id: 'nvc',
  title: 'Тренажер светских бесед',
  theme: {
    progressFrom: '#ffe08a',
    progressTo: '#ffb8c9',
    bubbleFrom: '#fff9f2',
    bubbleTo: '#ffe8d6',
    bubbleTail: '#fff9f2',
    stepLabel: '#c49080',
    titleAccent: '#e8879a',
    buttonFrom: '#ffe08a',
    buttonVia: '#ffc9b5',
    buttonTo: '#ffb8c9',
    buttonText: '#6b4540',
  },
  complete: {
    emoji: '🐺🐺🐺',
    message:
      'Наконец-то это закончилось. Мурчик гордится тобой. Больше никакого насилия, только УЛЬТРАНАСИЛИЕ! Переходи к следующему модулю.',
  },
  steps: trainingSteps,
}
