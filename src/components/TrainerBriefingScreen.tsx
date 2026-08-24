import { motion } from 'framer-motion'
import type { ComponentType } from 'react'
import type { TrainerSessionConfig } from '../types/trainer'

interface TrainerBriefingProps {
  session: TrainerSessionConfig
  Avatars: ComponentType[]
  onStart: () => void
  onBackToMenu: () => void
}

export function TrainerBriefingScreen({
  session,
  Avatars,
  onStart,
  onBackToMenu,
}: TrainerBriefingProps) {
  const briefing = session.briefing!

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_12px_40px_rgba(255,180,140,0.28)] backdrop-blur-md sm:p-8"
      >
        <button
          type="button"
          onClick={onBackToMenu}
          className="mb-4 cursor-pointer text-sm font-semibold text-[#8b635a] transition hover:text-[#5c4033]"
        >
          ← В меню
        </button>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            {Avatars.map((Avatar, i) => (
              <div key={i} className="origin-bottom scale-[0.7] [&_span:last-child]:hidden">
                <Avatar />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c49080]">
              {session.mentorLabel} · {session.topic}
            </p>
            <h1 className="text-xl font-bold text-[#5c4033] sm:text-2xl">
              {session.title}
            </h1>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#c49080]">
              Контекст
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6b4540]">
              {briefing.context}
            </p>
          </section>

          <section className="space-y-3">
            <div className="rounded-2xl border border-white/60 bg-[#fff9f2]/80 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#c49080]">
                Ваша роль
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#5c4033]">
                {briefing.role}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-[#fff9f2]/80 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#c49080]">
                Ваша цель
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#5c4033]">
                {briefing.goal}
              </p>
            </div>
          </section>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="mt-8 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-6 py-3 text-sm font-bold text-[#6b4540] shadow-md transition hover:brightness-105"
        >
          Начать диалог →
        </motion.button>
      </motion.div>
    </div>
  )
}
