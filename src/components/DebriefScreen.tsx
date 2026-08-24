import { motion } from 'framer-motion'
import type { TrainerSessionConfig } from '../types/trainer'

interface DebriefScreenProps {
  session: TrainerSessionConfig
  onBackToMenu: () => void
  onRetry: () => void
}

export function DebriefScreen({
  session,
  onBackToMenu,
  onRetry,
}: DebriefScreenProps) {
  const { debrief } = session

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_12px_40px_rgba(255,180,140,0.22)] backdrop-blur-md sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c49080]">
          Разбор полётов
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#5c4033]">{session.title}</h1>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ffe08a] to-[#ffb8c9] text-xl font-bold text-[#5c4033] shadow-sm">
            {debrief.score}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#7a5248]">Оценка</p>
            <p className="text-xs text-[#a07068]">из 100 баллов</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[#6b4540]">
          {debrief.summary}
        </p>

        <div className="mt-5 rounded-2xl bg-[#fff9f2] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c49080]">
            Советы наставника
          </p>
          <ul className="mt-2 space-y-2">
            {debrief.tips.map((tip, i) => (
              <li key={i} className="text-sm leading-relaxed text-[#6b4540]">
                • {tip}
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="mt-5 border-l-4 border-[#ffc9b5] pl-4 text-sm italic leading-relaxed text-[#8b635a]">
          {debrief.mentorQuote}
        </blockquote>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-6 py-2.5 text-sm font-semibold text-[#6b4540] shadow-sm transition hover:brightness-105"
          >
            Пройти ещё раз
          </button>
          <button
            type="button"
            onClick={onBackToMenu}
            className="cursor-pointer rounded-full border border-white/70 bg-white/60 px-6 py-2.5 text-sm font-semibold text-[#7a5248] shadow-sm transition hover:bg-white/80"
          >
            Вернуться в меню
          </button>
        </div>
      </motion.div>
    </div>
  )
}
