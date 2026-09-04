import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ComponentType } from 'react'
import type { GoalId } from '../data/learningGoals'
import type { TrainingModuleConfig, TrainingTheme } from '../types/training'

const smoothEase = [0.22, 1, 0.36, 1] as const

const enterTransition = {
  duration: 0.65,
  ease: smoothEase,
}

const exitTransition = {
  duration: 0.58,
  ease: smoothEase,
}

const bubbleEnter = {
  opacity: 0,
  x: 24,
  scale: 0.97,
}

const bubbleCenter = {
  opacity: 1,
  x: 0,
  scale: 1,
}

const mentorEnter = {
  opacity: 0,
  scale: 0.94,
  x: -10,
}

const mentorVisible = {
  opacity: 1,
  scale: 1,
  x: 0,
}

const bubbleSwipeExit = {
  opacity: 0,
  x: 72,
  scale: 0.96,
  transition: exitTransition,
}

const mentorExit = {
  opacity: 0,
  scale: 0.9,
  x: -18,
  transition: exitTransition,
}

const quizEnter = {
  opacity: 0,
  y: 18,
}

const quizVisible = {
  opacity: 1,
  y: 0,
}

const quizExit = {
  opacity: 0,
  y: 10,
  transition: exitTransition,
}

const feedbackEnter = {
  opacity: 0,
  y: 10,
  scale: 0.98,
}

const feedbackVisible = {
  opacity: 1,
  y: 0,
  scale: 1,
}

const feedbackExit = {
  opacity: 0,
  y: -6,
  scale: 0.98,
  transition: exitTransition,
}

function ProgressBar({
  stepIndex,
  steps,
  theme,
}: {
  stepIndex: number
  steps: TrainingModuleConfig['steps']
  theme: TrainingTheme
}) {
  return (
    <div className="w-full shrink-0" aria-label="Прогресс обучения">
      <div className="flex gap-1 px-0 sm:gap-1.5">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                i <= stepIndex ? '' : 'bg-white/60'
              }`}
              style={
                i <= stepIndex
                  ? {
                      background: `linear-gradient(to right, ${theme.progressFrom}, ${theme.progressTo})`,
                    }
                  : undefined
              }
            />
            <span
              className={`hidden h-8 w-full text-center text-[10px] font-semibold leading-tight sm:block ${
                i === stepIndex ? 'text-[#7a5248]' : ''
              }`}
              style={i !== stepIndex ? { color: theme.stepLabel } : undefined}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinaleActions({
  onStartComprehensive,
  showComprehensive,
  onRestart,
  onBackToMenu,
}: {
  onStartComprehensive?: () => void
  showComprehensive?: boolean
  onRestart: () => void
  onBackToMenu: () => void
}) {
  return (
    <div className="mt-6 flex w-full flex-col items-center gap-3">
      {showComprehensive && onStartComprehensive && (
        <button
          type="button"
          onClick={onStartComprehensive}
          className="w-full max-w-xs cursor-pointer rounded-full border border-[#d4b896]/50 bg-gradient-to-br from-[#f3e8dc] to-[#e0d2c4] px-6 py-2.5 text-sm font-semibold text-[#5c4033] shadow-sm transition hover:brightness-[1.02] active:scale-[0.98] sm:max-w-sm"
        >
          Комплексный тренажер: Треугольник интересов
        </button>
      )}
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="cursor-pointer rounded-full border border-white/70 bg-white/60 px-6 py-2.5 text-sm font-semibold text-[#7a5248] shadow-sm transition hover:bg-white/80 active:scale-[0.98]"
        >
          Пройти обучение заново
        </button>
        <button
          type="button"
          onClick={onBackToMenu}
          className="cursor-pointer rounded-full border border-white/70 bg-white/60 px-6 py-2.5 text-sm font-semibold text-[#7a5248] shadow-sm transition hover:bg-white/80 active:scale-[0.98]"
        >
          Вернуться в меню
        </button>
      </div>
    </div>
  )
}

interface TrainingModuleProps {
  config: TrainingModuleConfig
  Avatar: ComponentType
  goalId: GoalId
  onBackToMenu: () => void
  onStartComprehensive?: () => void
  onModuleComplete?: (goalId: GoalId) => void
  allModulesComplete?: boolean
}

export function TrainingModule({
  config,
  Avatar,
  goalId,
  onBackToMenu,
  onStartComprehensive,
  onModuleComplete,
  allModulesComplete,
}: TrainingModuleProps) {
  const { steps, theme, complete } = config

  const [stepIndex, setStepIndex] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const step = steps[stepIndex]
  const isFinaleStep = Boolean(step.isFinale)
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
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
      resetStepState()
    } else if (complete) {
      setIsComplete(true)
    }
  }

  const handleContinue = () => {
    if (showChoices || isFinaleStep) return

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
  const showEndScreen = isComplete || isFinaleStep

  useEffect(() => {
    if (showEndScreen && onModuleComplete) {
      onModuleComplete(goalId)
    }
  }, [showEndScreen, goalId, onModuleComplete])

  const primaryLabel = showChoices
    ? canProceedFromChoice
      ? stepIndex === steps.length - 1
        ? 'Завершить'
        : 'Далее'
      : 'Выбери ответ'
    : step.continueLabel ?? 'Ага!'

  const primaryAction = showChoices ? handleNextStep : handleContinue
  const primaryDisabled = showChoices && !canProceedFromChoice

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center px-3 pb-16 sm:px-4">
      {!showEndScreen && (
        <button
          type="button"
          onClick={onBackToMenu}
          className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 cursor-pointer rounded-full border border-white/60 bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-[#7a5248] shadow-sm backdrop-blur-sm transition hover:bg-white/90 sm:left-6 sm:top-6"
        >
          ← В меню
        </button>
      )}

      <div className="fixed left-1/2 top-[22%] z-20 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-3 sm:top-[28%] sm:px-4 md:top-[30%]">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="min-h-[2.25rem] text-center text-xl font-bold leading-tight text-[#5c4033] sm:min-h-[3rem] sm:text-3xl"
        >
          {config.title}
          {config.id === 'nvc' && (
            <span style={{ color: theme.titleAccent }}> &lt;3</span>
          )}
        </motion.h1>

        {!showEndScreen && (
          <div className="mt-3 min-h-[3.5rem] sm:mt-4 sm:min-h-[4.5rem]">
            <ProgressBar stepIndex={stepIndex} steps={steps} theme={theme} />
            <p
              className="mt-3 min-h-[1.25rem] text-center text-xs font-bold uppercase tracking-wide"
              style={{ color: theme.stepLabel }}
            >
              Шаг {step.id} · {step.title}
            </p>
          </div>
        )}
      </div>

      <div
        className={`flex w-full max-w-lg flex-col items-center justify-center ${
          showEndScreen
            ? 'min-h-[calc(68dvh-2rem)] pt-[calc(22dvh+2rem)] sm:min-h-[calc(70vh-2rem)] sm:pt-[calc(28vh+2.5rem)] md:pt-[calc(30vh+2.5rem)]'
            : 'min-h-[calc(68dvh-4rem)] pt-[calc(22dvh+4.5rem)] sm:min-h-[calc(70vh-4rem)] sm:pt-[calc(28vh+5.5rem)] md:pt-[calc(30vh+6rem)]'
        }`}
      >
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {isComplete && complete ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col items-center py-6 text-center"
            >
              <p className="text-2xl tracking-widest">{complete.emoji}</p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#8b635a] sm:text-lg">
                {complete.message}
              </p>
              <FinaleActions
                onStartComprehensive={onStartComprehensive}
                showComprehensive={allModulesComplete}
                onRestart={restart}
                onBackToMenu={onBackToMenu}
              />
            </motion.div>
          ) : isFinaleStep ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col items-center py-6"
            >
              <div className="mx-auto flex w-full max-w-md items-start justify-center gap-3 sm:gap-4">
                <div className="shrink-0">
                  <Avatar />
                </div>
                <div
                  className="relative min-w-0 flex-1 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm sm:px-5 sm:py-4"
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.bubbleFrom}, ${theme.bubbleTo})`,
                  }}
                >
                  <span
                    className="absolute -left-2 top-5 h-4 w-4 rotate-45"
                    style={{ background: theme.bubbleTail }}
                    aria-hidden="true"
                  />
                  <p className="relative text-left text-[15px] leading-relaxed text-[#6b4540] sm:text-base">
                    {step.messages[0]}
                  </p>
                </div>
              </div>
              <FinaleActions
                onStartComprehensive={onStartComprehensive}
                showComprehensive={allModulesComplete}
                onRestart={restart}
                onBackToMenu={onBackToMenu}
              />
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
                      transition={enterTransition}
                      className="shrink-0"
                    >
                      <Avatar />
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
                        transition={enterTransition}
                      >
                        <div
                          className="relative rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm sm:px-5 sm:py-4"
                          style={{
                            background: `linear-gradient(to bottom right, ${theme.bubbleFrom}, ${theme.bubbleTo})`,
                          }}
                        >
                          <span
                            className="absolute -left-2 top-5 h-4 w-4 rotate-45"
                            style={{ background: theme.bubbleTail }}
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

              <AnimatePresence mode="wait">
                {showChoices && (
                  <motion.div
                    key={`quiz-${stepIndex}`}
                    initial={quizEnter}
                    animate={quizVisible}
                    exit={quizExit}
                    transition={enterTransition}
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
                          className={`w-full break-words rounded-2xl border-2 px-4 py-2.5 text-left text-sm leading-relaxed text-[#6b4540] transition-all active:scale-[0.99] ${borderClass}`}
                        >
                          {option.text}
                        </button>
                      )
                    })}

                    <AnimatePresence mode="wait">
                      {selectedOption && (
                        <motion.div
                          key={selectedOption.id}
                          initial={feedbackEnter}
                          animate={feedbackVisible}
                          exit={feedbackExit}
                          transition={enterTransition}
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
                      : 'cursor-pointer hover:brightness-105'
                  }`}
                  style={
                    primaryDisabled
                      ? undefined
                      : {
                          background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonVia}, ${theme.buttonTo})`,
                          color: theme.buttonText,
                        }
                  }
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
