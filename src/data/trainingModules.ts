import { boundariesTrainingSteps } from './boundariesTrainingSteps'
import { negotiateTrainingSteps } from './negotiateTrainingSteps'
import { nvcTrainingModule } from './nvcTrainingModule'
import type { TrainingModuleConfig } from '../types/training'

export const trainingModules: Record<string, TrainingModuleConfig> = {
  self: nvcTrainingModule,
  negotiate: negotiateTrainingSteps,
  boundaries: boundariesTrainingSteps,
}

export function getTrainingModule(goalId: string): TrainingModuleConfig | undefined {
  return trainingModules[goalId]
}
