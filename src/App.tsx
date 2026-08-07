import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { ComingSoonNotice } from './components/ComingSoonNotice'
import { GoalMenu } from './components/GoalMenu'
import { TrainingModule } from './components/TrainingModule'
import { WatercolorBackground } from './components/WatercolorBackground'
import type { GoalId } from './data/learningGoals'

type Screen = 'menu' | 'training' | 'coming-soon'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  const handleGoalSelect = (goalId: GoalId) => {
    if (goalId === 'self') {
      setScreen('training')
    } else {
      setScreen('coming-soon')
    }
  }

  const goToMenu = () => setScreen('menu')

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

          {screen === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full justify-center"
            >
              <TrainingModule onBackToMenu={goToMenu} />
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
