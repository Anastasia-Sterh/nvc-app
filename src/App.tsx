import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ComponentType } from 'react'
import { ArniAvatar } from './components/ArniAvatar'
import { BjornAvatar } from './components/BjornAvatar'
import { ChatTrainer } from './components/ChatTrainer'
import { ComingSoonNotice } from './components/ComingSoonNotice'
import { DebriefScreen } from './components/DebriefScreen'
import { GoalMenu } from './components/GoalMenu'
import { MentorAvatar } from './components/MentorAvatar'
import { TrainingModule } from './components/TrainingModule'
import { WatercolorBackground } from './components/WatercolorBackground'
import { WelcomeModal } from './components/WelcomeModal'
import type { GoalId } from './data/learningGoals'
import { getTrainerSession } from './data/trainerSessions'
import { getTrainingModule } from './data/trainingModules'
import { useWelcomeSeen } from './hooks/useWelcomeSeen'
import type { TrainerId, TrainerSessionConfig } from './types/trainer'

type Screen = 'menu' | 'training' | 'chat' | 'debrief' | 'coming-soon'

const avatarByModule: Record<string, ComponentType> = {
  self: MentorAvatar,
  negotiate: ArniAvatar,
  boundaries: BjornAvatar,
}

const avatarsByTrainer: Record<TrainerId, ComponentType[]> = {
  self: [MentorAvatar],
  negotiate: [ArniAvatar],
  boundaries: [BjornAvatar],
  comprehensive: [MentorAvatar, ArniAvatar, BjornAvatar],
}

function App() {
  const { hasSeenWelcome, markWelcomeSeen } = useWelcomeSeen()
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome)
  const [screen, setScreen] = useState<Screen>('menu')
  const [activeGoalId, setActiveGoalId] = useState<GoalId | null>(null)
  const [activeTrainerId, setActiveTrainerId] = useState<TrainerId | null>(null)
  const [trainerSession, setTrainerSession] = useState<TrainerSessionConfig | null>(null)

  const closeWelcome = () => {
    markWelcomeSeen()
    setShowWelcome(false)
  }

  const startTrainer = (trainerId: TrainerId) => {
    const session = getTrainerSession(trainerId)
    if (!session) return
    setActiveTrainerId(trainerId)
    setTrainerSession(session)
    setScreen('chat')
  }

  const handleGoalSelect = (goalId: GoalId) => {
    const module = getTrainingModule(goalId)
    if (module) {
      setActiveGoalId(goalId)
      setScreen('training')
    } else {
      setScreen('coming-soon')
    }
  }

  const goToMenu = () => {
    setScreen('menu')
    setActiveGoalId(null)
    setActiveTrainerId(null)
    setTrainerSession(null)
  }

  const handleStartModuleTrainer = () => {
    if (activeGoalId) {
      startTrainer(activeGoalId)
    }
  }

  const handleFinishTraining = () => {
    setScreen('debrief')
  }

  const handleRetryTraining = () => {
    if (activeTrainerId) {
      startTrainer(activeTrainerId)
    }
  }

  const activeModule = activeGoalId ? getTrainingModule(activeGoalId) : undefined
  const Avatar = activeGoalId ? avatarByModule[activeGoalId] ?? MentorAvatar : MentorAvatar
  const chatAvatars = activeTrainerId ? avatarsByTrainer[activeTrainerId] : [MentorAvatar]

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WatercolorBackground />

      <div className="relative z-10 flex min-h-screen w-full justify-center">
        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <GoalMenu
                onSelect={handleGoalSelect}
                onStartPractice={() => startTrainer('comprehensive')}
              />
            </motion.div>
          )}

          {screen === 'training' && activeModule && (
            <motion.div
              key={`training-${activeGoalId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full justify-center"
            >
              <TrainingModule
                config={activeModule}
                Avatar={Avatar}
                onBackToMenu={goToMenu}
                onStartTrainer={handleStartModuleTrainer}
              />
            </motion.div>
          )}

          {screen === 'chat' && trainerSession && (
            <motion.div
              key={`chat-${activeTrainerId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full justify-center"
            >
              <ChatTrainer
                session={trainerSession}
                Avatars={chatAvatars}
                onFinish={handleFinishTraining}
                onBackToMenu={goToMenu}
              />
            </motion.div>
          )}

          {screen === 'debrief' && trainerSession && (
            <motion.div
              key={`debrief-${activeTrainerId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <DebriefScreen
                session={trainerSession}
                onBackToMenu={goToMenu}
                onRetry={handleRetryTraining}
              />
            </motion.div>
          )}

          {screen === 'coming-soon' && (
            <motion.div
              key="coming-soon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ComingSoonNotice onBack={goToMenu} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {screen === 'menu' && showWelcome && (
        <WelcomeModal onClose={closeWelcome} />
      )}
    </div>
  )
}

export default App
