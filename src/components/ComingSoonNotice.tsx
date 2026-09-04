import { motion } from 'framer-motion'

interface ComingSoonNoticeProps {
  onBack: () => void
}

export function ComingSoonNotice({ onBack }: ComingSoonNoticeProps) {
  return (
    <div className="flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full rounded-3xl border border-white/60 bg-white/55 p-8 text-center shadow-[0_8px_32px_rgba(255,180,140,0.25)] backdrop-blur-md sm:p-10"
      >
        <p className="text-3xl">✨</p>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-[#7a5248]">
          Этот модуль скоро появится!
        </p>
        <p className="mt-2 text-base leading-relaxed text-[#8b635a]">
          Попробуй пока обучение с Мурчиком
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-8 cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-6 py-2.5 text-sm font-semibold text-[#6b4540] shadow-sm transition hover:brightness-105 active:scale-[0.98]"
        >
          ← В меню
        </button>
      </motion.div>
    </div>
  )
}
