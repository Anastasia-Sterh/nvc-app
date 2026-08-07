import { motion } from 'framer-motion'
import { learningGoals, type GoalId } from '../data/learningGoals'

interface GoalMenuProps {
  onSelect: (goalId: GoalId) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function GoalMenu({ onSelect }: GoalMenuProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12">
      <motion.p
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-sm font-semibold text-[#c49080]"
      >
        Тренажер светских бесед <span className="text-[#e8879a]">&lt;3</span>
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-10 max-w-md text-center text-2xl font-bold leading-tight text-[#5c4033] sm:text-3xl"
      >
        Чему ты хочешь научиться?
      </motion.h1>

      <div className="mx-auto grid grid-cols-1 place-items-center gap-6 sm:grid-cols-3 sm:gap-5">
        {learningGoals.map((goal, i) => (
          <motion.button
            key={goal.id}
            type="button"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(goal.id)}
            className="flex aspect-square w-[17rem] cursor-pointer flex-col rounded-3xl border border-white/60 bg-white/55 p-5 text-left shadow-[0_8px_32px_rgba(255,180,140,0.22)] backdrop-blur-md transition hover:brightness-[1.02] sm:w-[15rem] sm:p-5"
          >
            <div
              className="mb-3 h-1.5 w-14 shrink-0 rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9]"
              aria-hidden="true"
            />
            <h2 className="text-base font-bold leading-snug text-[#5c4033] sm:text-lg">
              {goal.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#8b635a]">
              {goal.description}
            </p>
            {!goal.available && (
              <span className="mt-2 inline-block w-fit shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#a07068]">
                Скоро
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
