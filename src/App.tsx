import { motion } from 'framer-motion'
import { TrainingModule } from './components/TrainingModule'
import { WatercolorBackground } from './components/WatercolorBackground'

function App() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden px-4 py-6">
      <WatercolorBackground />

      <div className="relative z-10 flex h-full max-h-[720px] w-full max-w-xl flex-col items-center justify-center gap-4 py-2">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center text-2xl font-bold leading-tight text-[#5c4033] sm:text-3xl"
        >
          Тренажер светских бесед{' '}
          <span className="text-[#e8879a]">&lt;3</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full"
        >
          <TrainingModule />
        </motion.div>
      </div>
    </div>
  )
}

export default App
