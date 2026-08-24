import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ComponentType } from 'react'
import { ArniAvatar } from './components/ArniAvatar'
import { BjornAvatar } from './components/BjornAvatar'
import { ChatTrainer } from './components/ChatTrainer'
import { ComingSoonNotice } from './components/ComingSoonNotice'
import { DebriefScreen } from './components/DebriefScreen'
import { GoalMenu } from './components/GoalMenu'
import { MentorAvatar } from './components/MentorAvatar'
import { TrainerBriefingScreen } from './components/TrainerBriefingScreen'
import { TrainingModule } from './components/TrainingModule'
import { WatercolorBackground } from './components/WatercolorBackground'
import { WelcomeModal } from './components/WelcomeModal'
import type { GoalId } from './data/learningGoals'
import { getTrainerSession } from './data/trainerSessions'
import { getTrainingModule } from './data/trainingModules'
import { useModuleProgress } from './hooks/useModuleProgress'
import { useWelcomeSeen } from './hooks/useWelcomeSeen'
import type { SimulationResult, TrainerId, TrainerSessionConfig } from './types/trainer'

type Screen = 'menu' | 'training' | 'briefing' | 'chat' | 'debrief' | 'coming-soon'

const avatarByModule: Record<string, ComponentType> = {
  self: MentorAvatar,
  negotiate: ArniAvatar,
  boundaries: BjornAvatar,
}

const avatarsByTrainer: Record<TrainerId, ComponentType[]> = {
  comprehensive: [MentorAvatar, ArniAvatar, BjornAvatar],
}

function App() {
  const { hasSeenWelcome, markWelcomeSeen } = useWelcomeSeen()
  const { markComplete, allComplete } = useModuleProgress()
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome)
  const [screen, setScreen] = useState<Screen>('menu')
  const [activeGoalId, setActiveGoalId] = useState<GoalId | null>(null)
  const [activeTrainerId, setActiveTrainerId] = useState<TrainerId | null>(null)
  const [trainerSession, setTrainerSession] = useState<TrainerSessionConfig | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  const closeWelcome = () => {
    markWelcomeSeen()
    setShowWelcome(false)
  }

  const startTrainer = (trainerId: TrainerId) => {
    const session = getTrainerSession(trainerId)
    if (!session) return
    setActiveTrainerId(trainerId)
    setTrainerSession(session)
    setSimulationResult(null)
    setScreen(session.briefing ? 'briefing' : 'chat')
  }

  const handleStartChat = () => {
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
    setSimulationResult(null)
  }

  const handleFinishTraining = (result: SimulationResult) => {
    setSimulationResult(result)
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
                goalId={activeGoalId!}
                onBackToMenu={goToMenu}
                onStartComprehensive={() => startTrainer('comprehensive')}
                onModuleComplete={markComplete}
                allModulesComplete={allComplete}
              />
            </motion.div>
          )}

          {screen === 'briefing' && trainerSession?.briefing && (
            <motion.div
              key={`briefing-${activeTrainerId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <TrainerBriefingScreen
                session={trainerSession}
                Avatars={chatAvatars}
                onStart={handleStartChat}
                onBackToMenu={goToMenu}
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
                result={simulationResult}
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
