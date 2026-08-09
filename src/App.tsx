import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { ArniAvatar } from './components/ArniAvatar'
import { BjornAvatar } from './components/BjornAvatar'
import { ComingSoonNotice } from './components/ComingSoonNotice'
import { GoalMenu } from './components/GoalMenu'
import { MentorAvatar } from './components/MentorAvatar'
import { TrainingModule } from './components/TrainingModule'
import { WatercolorBackground } from './components/WatercolorBackground'
import type { GoalId } from './data/learningGoals'
import { getTrainingModule } from './data/trainingModules'

type Screen = 'menu' | 'training' | 'coming-soon'

const avatarByModule: Record<string, typeof MentorAvatar> = {
  self: MentorAvatar,
  negotiate: ArniAvatar,
  boundaries: BjornAvatar,
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [activeGoalId, setActiveGoalId] = useState<GoalId | null>(null)

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
  }

  const activeModule = activeGoalId ? getTrainingModule(activeGoalId) : undefined
  const Avatar = activeGoalId ? avatarByModule[activeGoalId] ?? MentorAvatar : MentorAvatar

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
              <GoalMenu onSelect={handleGoalSelect} />
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
    </div>
  )
}

export default App
