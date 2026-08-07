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

const bubbleSwipeExit = {
  opacity: 0,
  x: 140,
  scale: 0.92,
  transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const },
}

export function TrainingModule() {
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

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[min(520px,calc(100vh-10rem))] w-full flex-col items-center justify-center text-center"
      >
        <p className="text-2xl">🌸</p>
        <p className="mt-3 text-lg font-semibold text-[#7a5248]">
          Ты прошла первый модуль!
        </p>
        <p className="mt-2 max-w-sm text-base leading-relaxed text-[#8b635a]">
          Мурчик гордится тобой. Ты уже знаешь четыре шага ННО: наблюдение,
          чувство, потребность и просьба. Возвращайся — скоро будут новые
          упражнения!
        </p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-6 py-2.5 text-sm font-semibold text-[#6b4540] shadow-sm transition hover:brightness-105 active:scale-[0.98]"
        >
          Пройти ещё раз
        </button>
      </motion.div>
    )
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
    <div className="flex h-[min(520px,calc(100vh-10rem))] w-full flex-col gap-4">
      {/* Прогресс */}
      <div className="flex shrink-0 items-center gap-2 px-1">
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
              className={`hidden text-[10px] font-semibold sm:block ${
                i === stepIndex ? 'text-[#7a5248]' : 'text-[#c4a090]'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Диалог — без подложки */}
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-3 shrink-0 text-xs font-bold uppercase tracking-wide text-[#c49080]">
          Шаг {step.id} · {step.title}
        </p>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <MentorAvatar />

          <div className="relative h-[120px] min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {showBubble && (
                <motion.div
                  key={bubbleKey}
                  initial={bubbleEnter}
                  animate={bubbleCenter}
                  exit={bubbleSwipeExit}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center"
                >
                  <div className="relative max-h-full overflow-y-auto rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#fff9f2] to-[#ffe8d6] px-4 py-3 shadow-sm">
                    <span
                      className="absolute -left-2 top-4 h-4 w-4 rotate-45 bg-[#fff9f2]"
                      aria-hidden="true"
                    />
                    <p className="relative text-left text-[15px] leading-relaxed text-[#6b4540]">
                      {step.messages[messageIndex]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence>
            {showChoices && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-2"
              >
                <p className="text-sm font-semibold text-[#8b635a]">
                  {step.question}
                </p>

                {step.options!.map((option) => {
                  const isSelected = selectedOptionId === option.id

                  let borderClass =
                    'border-white/70 bg-white/60 hover:bg-white/80'
                  if (isSelected) {
                    borderClass = option.correct
                      ? 'border-[#a8d5a0] bg-[#f0faf0]'
                      : 'border-[#f0a8a8] bg-[#fff5f5]'
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
                            className="mt-2 block text-xs font-semibold underline"
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
        </div>
      </div>

      {/* Кнопка */}
      <motion.div className="flex shrink-0 justify-end">
        <motion.button
          type="button"
          onClick={primaryAction}
          disabled={primaryDisabled}
          whileTap={primaryDisabled ? undefined : { scale: 0.97 }}
          className={`rounded-full px-8 py-3 text-sm font-bold shadow-md transition-all ${
            primaryDisabled
              ? 'cursor-not-allowed bg-white/50 text-[#c4a090]'
              : 'bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] text-[#6b4540] hover:brightness-105'
          }`}
        >
          {primaryLabel}
          {!showChoices && !primaryDisabled && ' →'}
          {showChoices && canProceedFromChoice && ' →'}
        </motion.button>
      </motion.div>
    </div>
  )
}
