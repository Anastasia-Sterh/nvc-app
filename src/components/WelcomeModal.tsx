import { AnimatePresence, motion } from 'framer-motion'
import { ArniAvatar } from './ArniAvatar'
import { BjornAvatar } from './BjornAvatar'
import { MentorAvatar } from './MentorAvatar'

interface WelcomeModalProps {
  onClose: () => void
}

const mentors = [
  { Avatar: MentorAvatar, name: 'Мурчик' },
  { Avatar: ArniAvatar, name: 'Арни' },
  { Avatar: BjornAvatar, name: 'Бьерн' },
]

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#5c4033]/25 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl border border-white/60 bg-white/92 p-5 shadow-[0_16px_48px_rgba(255,180,140,0.35)] backdrop-blur-md sm:p-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/70 text-base leading-none text-[#8b635a] transition hover:bg-white"
          >
            ×
          </button>

          <div
            className="mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9]"
            aria-hidden="true"
          />

          <h1
            id="welcome-title"
            className="pr-6 text-xl font-bold leading-snug text-[#5c4033] sm:text-2xl"
          >
            Добро пожаловать в тренажер эффективных коммуникаций!
          </h1>

          <p className="mt-3 text-sm leading-snug text-[#6b4540] sm:text-[15px] sm:leading-relaxed">
            Тренажер по коммуникациям состоит из теоретической части с короткими
            заданиями по темам и финальной практики. Вы освоите техники
            ненасильственного общения, метод DEAR MAN и познакомитесь с
            инструментами Гарвардской школы переговоров. Вы можете сразу
            перейти к финальному заданию и получить обратную связь
          </p>

          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-[#c49080]">
            Ваши наставники
          </p>

          <ul className="mt-2 flex items-end justify-center gap-5 sm:gap-8">
            {mentors.map(({ Avatar, name }) => (
              <li key={name} className="flex flex-col items-center gap-1">
                <div className="origin-bottom scale-[0.72] sm:scale-[0.78] [&_span:last-child]:hidden">
                  <Avatar />
                </div>
                <span className="text-xs font-semibold text-[#5c4033] sm:text-sm">
                  {name}
                </span>
              </li>
            ))}
          </ul>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="mt-5 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-5 py-2.5 text-sm font-bold text-[#6b4540] shadow-md transition hover:brightness-105"
          >
            Понятненько, идем дальше
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
