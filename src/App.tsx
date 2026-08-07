import { motion } from 'framer-motion'

function App() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Акварельный фон */}
      <div className="pointer-events-none absolute inset-0 bg-[#fff8f0]" />

      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffe08a 0%, #ffd4a8 45%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-1/4 h-[380px] w-[380px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffc9b5 0%, #ffb8c9 50%, transparent 72%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffd6e8 0%, #ffe4c4 55%, transparent 75%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-3xl font-bold leading-tight text-[#5c4033] sm:text-4xl"
        >
          Тренажер светских бесед{' '}
          <span className="text-[#e8879a]">&lt;3</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-3xl border border-white/60 bg-white/55 p-8 shadow-[0_8px_32px_rgba(255,180,140,0.25)] backdrop-blur-md"
        >
          <p className="mb-2 text-lg font-semibold text-[#7a5248]">
            Добро пожаловать!
          </p>
          <p className="text-base leading-relaxed text-[#8b635a]">
            Здесь ты сможешь мягко тренировать ненасильственное общение —
            замечать чувства, формулировать просьбы и находить слова, которые
            согревают, а не ранят.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-5 py-2 text-sm font-semibold text-[#6b4540] shadow-sm"
          >
            Скоро здесь появятся упражнения ✨
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
