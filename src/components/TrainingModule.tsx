import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { trainingSteps } from '../data/trainingSteps'
import { MentorAvatar } from './MentorAvatar'

const bubbleEnter = {
  opacity: 0,
  x: 30,
  scale: 0.96,
}

const bubbleCenter = {
  opacity: 1,
  x: 0,
  scale: 1,
}

const mentorEnter = {
  opacity: 0,
  scale: 0.88,
  x: -12,
}

const mentorVisible = {
  opacity: 1,
  scale: 1,
  x: 0,
}

const bubbleSwipeExit = {
  opacity: 0,
  x: 140,
  scale: 0.92,
  transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const },
}

const mentorExit = {
  opacity: 0,
  scale: 0.82,
  x: -28,
  filter: 'blur(3px)',
  transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] as const },
}

function ProgressBar({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="w-full shrink-0" aria-label="Прогресс обучения">
      <div className="flex min-h-[2.75rem] items-end gap-2 px-1">
        {trainingSteps.map((s, i) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                i <= stepIndex
                  ? 'bg-gradient-to-r from-[#ffe08a] to-[#ffb8c9]'
                  : 'bg-white/60'
              }`}
            />
            <span
              className={`hidden min-h-[1rem] text-[10px] font-semibold sm:block ${
                i === stepIndex ? 'text-[#7a5248]' : 'text-[#c4a090]'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrainingModule({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const step = trainingSteps[stepIndex]
  const hasQuestion = Boolean(step.question && step.options)
  const isLastMessage = messageIndex >= step.messages.length - 1
  const showChoices = hasQuestion && showQuiz
  const selectedOption = step.options?.find((o) => o.id === selectedOptionId)
  const canProceedFromChoice = selectedOption?.correct === true

  const resetStepState = () => {
    setMessageIndex(0)
    setShowQuiz(false)
    setSelectedOptionId(null)
  }

  const goToNextStep = () => {
    if (stepIndex < trainingSteps.length - 1) {
      setStepIndex((i) => i + 1)
      resetStepState()
    } else {
      setIsComplete(true)
    }
  }

  const handleAga = () => {
    if (showChoices) return

    if (!isLastMessage) {
      setMessageIndex((i) => i + 1)
      return
    }

    if (hasQuestion) {
      setShowQuiz(true)
    } else {
      goToNextStep()
    }
  }

  const handleNextStep = () => {
    if (showChoices && canProceedFromChoice) {
      goToNextStep()
    }
  }

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId)
  }

  const restart = () => {
    setIsComplete(false)
    setStepIndex(0)
    resetStepState()
  }

  const showBubble = !showQuiz
  const bubbleKey = `${stepIndex}-${messageIndex}`

  const primaryLabel = showChoices
    ? canProceedFromChoice
      ? stepIndex === trainingSteps.length - 1
        ? 'Завершить'
        : 'Далее'
      : 'Выбери ответ'
    : 'Ага!'

  const primaryAction = showChoices ? handleNextStep : handleAga
  const primaryDisabled = showChoices && !canProceedFromChoice

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-4 pb-16">
      {!isComplete && (
        <button
          type="button"
          onClick={onBackToMenu}
          className="fixed left-4 top-4 z-30 cursor-pointer rounded-full border border-white/60 bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-[#7a5248] shadow-sm backdrop-blur-sm transition hover:bg-white/90 sm:left-6 sm:top-6"
        >
          ← В меню
        </button>
      )}

      {/* Шапка — по центру экрана (горизонталь + вертикаль), не смещается */}
      <div className="fixed left-1/2 top-[30%] z-20 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="min-h-[2.5rem] text-center text-2xl font-bold leading-tight text-[#5c4033] sm:min-h-[3rem] sm:text-3xl"
        >
          Тренажер светских бесед{' '}
          <span className="text-[#e8879a]">&lt;3</span>
        </motion.h1>

        {!isComplete && (
          <div className="mt-4 min-h-[4.5rem]">
            <ProgressBar stepIndex={stepIndex} />
            <p className="mt-3 min-h-[1.25rem] text-center text-xs font-bold uppercase tracking-wide text-[#c49080]">
              Шаг {step.id} · {step.title}
            </p>
          </div>
        )}
      </div>

      {/* Контент — по центру экрана, растёт только этот блок */}
      <div
        className={`flex w-full max-w-lg flex-col items-center justify-center ${
          isComplete ? 'min-h-[calc(70vh-2rem)] pt-[calc(30vh+2.5rem)]' : 'min-h-[calc(70vh-4rem)] pt-[calc(30vh+6rem)]'
        }`}
      >
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
        {isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center py-6 text-center"
          >
            <p className="text-2xl tracking-widest">🐺🐺🐺</p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#8b635a] sm:text-lg">
              Наконец-то это закончилось. Мурчик гордится тобой. Больше
              никакого насилия, только УЛЬТРАНАСИЛИЕ! Переходи к следующему
              модулю.
            </p>
            <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={restart}
                className="cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-6 py-2.5 text-sm font-semibold text-[#6b4540] shadow-sm transition hover:brightness-105 active:scale-[0.98]"
              >
                Пройти заново
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="cursor-pointer rounded-full border border-white/70 bg-white/60 px-6 py-2.5 text-sm font-semibold text-[#7a5248] shadow-sm transition hover:bg-white/80 active:scale-[0.98]"
              >
                Вернуться в меню
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex w-full max-w-md items-start justify-center gap-3 sm:gap-4"
            >
              <AnimatePresence mode="wait">
                {!showChoices && (
                  <motion.div
                    key={`mentor-${stepIndex}`}
                    layout
                    initial={mentorEnter}
                    animate={mentorVisible}
                    exit={mentorExit}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0"
                  >
                    <MentorAvatar />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div layout className="min-w-0 flex-1">
                <AnimatePresence mode="wait">
                  {showBubble && (
                    <motion.div
                      key={bubbleKey}
                      layout
                      initial={bubbleEnter}
                      animate={bubbleCenter}
                      exit={bubbleSwipeExit}
                      transition={{
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="relative rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#fff9f2] to-[#ffe8d6] px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                        <span
                          className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-[#fff9f2]"
                          aria-hidden="true"
                        />
                        <p className="relative text-left text-[15px] leading-relaxed text-[#6b4540] sm:text-base">
                          {step.messages[messageIndex]}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {showChoices && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mt-1 space-y-2"
                >
                <p className="text-sm font-semibold text-[#8b635a]">
                  {step.question}
                </p>

                {step.options!.map((option) => {
                  const isSelected = selectedOptionId === option.id

                  let borderClass =
                    'border-white/70 bg-white/60 hover:bg-white/80 cursor-pointer'
                  if (isSelected) {
                    borderClass = option.correct
                      ? 'border-[#a8d5a0] bg-[#f0faf0] cursor-pointer'
                      : 'border-[#f0a8a8] bg-[#fff5f5] cursor-pointer'
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionSelect(option.id)}
                      className={`w-full rounded-2xl border-2 px-4 py-2.5 text-left text-sm leading-relaxed text-[#6b4540] transition-all active:scale-[0.99] ${borderClass}`}
                    >
                      {option.text}
                    </button>
                  )
                })}

                <AnimatePresence>
                  {selectedOption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          selectedOption.correct
                            ? 'bg-[#e8f5e4] text-[#4a6b45]'
                            : 'bg-[#fdeaea] text-[#8b5050]'
                        }`}
                      >
                        {selectedOption.feedback}
                        {!selectedOption.correct && (
                          <button
                            type="button"
                            onClick={() => setSelectedOptionId(null)}
                            className="mt-2 block cursor-pointer text-xs font-semibold underline hover:opacity-80"
                          >
                            Попробовать снова
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout className="mt-4 flex w-full justify-center">
              <motion.button
                type="button"
                onClick={primaryAction}
                disabled={primaryDisabled}
                whileTap={primaryDisabled ? undefined : { scale: 0.97 }}
                className={`rounded-full px-8 py-3 text-sm font-bold shadow-md transition-all ${
                  primaryDisabled
                    ? 'cursor-not-allowed bg-white/50 text-[#c4a090]'
                    : 'cursor-pointer bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] text-[#6b4540] hover:brightness-105'
                }`}
              >
                {primaryLabel}
                {!showChoices && !primaryDisabled && ' →'}
                {showChoices && canProceedFromChoice && ' →'}
              </motion.button>
            </motion.div>
          </>
        )}
      </motion.div>
      </div>
    </div>
  )
}
