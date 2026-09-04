import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useOpenRouterKey } from '../hooks/useOpenRouterKeyState'
import {
  buildSimulationResult,
  mergeEvaluations,
  runSimulationTurn,
} from '../services/runSimulationTurn'
import { formatCostUsd } from '../services/openRouter'
import {
  buildProfanityHardStopResponse,
  containsProfanityOrAbuse,
} from '../services/profanityFilter'
import {
  buildMeaninglessMessageResponse,
  dialogueToChatMessage,
  EFFICIENCY_AUTO_COMPLETE,
  EFFICIENCY_HINT_THRESHOLD,
  getActiveMentorForHint,
  MAX_ON_DEMAND_HINTS,
  mergeMilestones,
  MILESTONE_STEPS,
} from '../services/trainerSimulation'
import { isMeaninglessUserMessage } from '../services/messageQuality'
import {
  clearChatSession,
  readChatSession,
  writeChatSession,
} from '../services/appPersistence'
import type {
  AiTurnResponse,
  ChatMessage,
  NegotiationMilestones,
  SimulationEndReason,
  SimulationResult,
  SingleMessageEvaluation,
  TrainerSessionConfig,
} from '../types/trainer'
import { EMPTY_MILESTONES } from '../types/trainer'

interface ChatTrainerProps {
  session: TrainerSessionConfig
  Avatars: ComponentType[]
  onFinish: (result: SimulationResult) => void
  onBackToMenu: () => void
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}
    >
      {!isUser && message.senderName && (
        <p className="mb-1 text-xs font-semibold text-[#a07068]">{message.senderName}</p>
      )}
      <div
        className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#ffe08a] to-[#ffc9b5] text-[#5c4033]'
            : 'rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#fff9f2] to-[#ffe8d6] text-[#6b4540]'
        }`}
      >
        {message.text}
      </div>
      {!isUser && message.costUsd != null && (
        <p className="mt-1 text-[10px] text-[#b89890]">
          {formatCostUsd(message.costUsd)}
        </p>
      )}
    </motion.div>
  )
}

function EfficiencyBar({ value, compact = false }: { value: number; compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#a8d5a0]"
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-bold text-[#5c4033]">{Math.round(value)}%</span>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#8b635a]">Эффективность коммуникации</span>
        <span className="font-bold text-[#5c4033]">{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/60">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#a8d5a0]"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

function MessageCounterBadge({
  current,
  max,
  size = 'default',
}: {
  current: number
  max: number
  size?: 'default' | 'large'
}) {
  const ratio = max > 0 ? current / max : 0
  const remaining = max - current

  let colorClass =
    'border-[#a8d5a0] bg-[#e8f5e9] text-[#4a6b45]'
  if (ratio >= 0.6) {
    colorClass = 'border-[#ffc9b5] bg-[#fff3e0] text-[#b45309]'
  }
  if (ratio >= 0.8 || remaining <= 2) {
    colorClass = 'border-[#ffb8c9] bg-[#ffebee] text-[#c62828]'
  }

  const sizeClass =
    size === 'large'
      ? 'px-3 py-1.5 text-base'
      : 'px-2.5 py-1 text-sm'

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-bold tabular-nums ${colorClass} ${sizeClass}`}
      title={`Отправлено ${current} из ${max} сообщений`}
    >
      <span className="text-[10px] opacity-70" aria-hidden="true">
        💬
      </span>
      <span>
        {current}/{max}
      </span>
    </div>
  )
}

function GoalIntroModal({
  maxMessages,
  onClose,
}: {
  maxMessages: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5c4033]/25 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-intro-title"
      >
        <p
          id="goal-intro-title"
          className="text-center text-lg font-bold leading-snug text-[#5c4033] sm:text-xl"
        >
          Наладьте контакт за {maxMessages} сообщений
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-[#6b4540]">
          У вас ограниченное число реплик — каждое сообщение важно для
          эффективности диалога
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] py-3 text-sm font-bold text-[#6b4540] shadow-sm transition hover:brightness-105"
        >
          Окейс!
        </button>
      </motion.div>
    </div>
  )
}

function MilestonesChips({ milestones }: { milestones: NegotiationMilestones }) {
  const doneByKey = {
    empathy: milestones.empathy_completed,
    boundaries: milestones.boundaries_completed,
    win_win: milestones.win_win_completed,
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-2">
      {MILESTONE_STEPS.map((step) => {
        const done = doneByKey[step.key]
        const shortLabel = step.label.replace(/^Этап \d+: /, '')
        return (
          <span
            key={step.key}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium leading-none ${
              done ? 'bg-[#f0faf0] text-[#4a6b45]' : 'bg-white/70 text-[#8b635a]'
            }`}
          >
            {done ? '☑' : '☐'} {shortLabel}
          </span>
        )
      })}
    </div>
  )
}

function MilestonesPanel({ milestones }: { milestones: NegotiationMilestones }) {
  const doneByKey = {
    empathy: milestones.empathy_completed,
    boundaries: milestones.boundaries_completed,
    win_win: milestones.win_win_completed,
  }

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#c49080]">
        Этапы переговоров
      </p>
      {MILESTONE_STEPS.map((step) => {
        const done = doneByKey[step.key]
        return (
          <div
            key={step.key}
            className={`flex items-start gap-2 rounded-xl px-2.5 py-1.5 text-[11px] leading-snug ${
              done ? 'bg-[#f0faf0]/90 text-[#4a6b45]' : 'bg-white/50 text-[#8b635a]'
            }`}
          >
            <span className="mt-0.5 shrink-0 font-mono text-xs">{done ? '☑' : '☐'}</span>
            <span>
              <span className="font-semibold">{step.label}.</span>{' '}
              <span className="break-words">{step.description}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HintModal({
  mentor,
  hint,
  onClose,
}: {
  mentor: string
  hint: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[#a8d5a0]/50 bg-[#f0faf0] p-4 shadow-lg sm:p-5"
      >
        <p className="text-xs font-bold text-[#4a6b45]">💡 Подсказка · {mentor}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#4a6b45]">{hint}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full cursor-pointer rounded-full bg-white/80 py-2 text-sm font-semibold text-[#5c4033] transition hover:bg-white"
        >
          Понятно
        </button>
      </motion.div>
    </div>
  )
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    text,
  }
}

function appendAssistantMessage(
  prev: ChatMessage[],
  response: AiTurnResponse,
): ChatMessage[] {
  const assistantMsg = dialogueToChatMessage(response.dialogue, response.requestCostUsd)
  const lastUser = [...prev].reverse().find((m) => m.role === 'user')

  if (lastUser && assistantMsg.text.trim() === lastUser.text.trim()) {
    return prev
  }

  const last = prev[prev.length - 1]
  if (last?.role === 'assistant' && last.text === assistantMsg.text) {
    return prev
  }

  return [...prev, assistantMsg]
}

export function ChatTrainer({
  session,
  Avatars,
  onFinish,
  onBackToMenu,
}: ChatTrainerProps) {
  const { apiKey, hasKey } = useOpenRouterKey()
  const savedSession = readChatSession(session.id)

  const [messages, setMessages] = useState<ChatMessage[]>(
    () =>
      savedSession?.messages ??
      session.initialMessages.filter((m) => m.role === 'assistant'),
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [efficiency, setEfficiency] = useState(savedSession?.efficiency ?? 0)
  const [mentorHint, setMentorHint] = useState<AiTurnResponse['hint_from_mentor'] | null>(
    savedSession?.mentorHint ?? null,
  )
  const [evaluations, setEvaluations] = useState<SingleMessageEvaluation[]>(
    savedSession?.evaluations ?? [],
  )
  const [milestones, setMilestones] = useState<NegotiationMilestones>(
    savedSession?.milestones ?? EMPTY_MILESTONES,
  )
  const [hintOnDemand, setHintOnDemand] = useState(savedSession?.hintOnDemand ?? '')
  const [hintsRemaining, setHintsRemaining] = useState(
    savedSession?.hintsRemaining ?? MAX_ON_DEMAND_HINTS,
  )
  const [showHintModal, setShowHintModal] = useState(false)
  const [showMobileMilestones, setShowMobileMilestones] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(
    () => session.id === 'comprehensive' && !savedSession?.goalModalSeen,
  )
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  const isComprehensive = session.id === 'comprehensive'

  const finishSimulation = (result: SimulationResult) => {
    clearChatSession()
    onFinish(result)
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const finishingRef = useRef(false)
  const messagesRef = useRef(messages)
  const milestonesRef = useRef(milestones)
  const efficiencyRef = useRef(efficiency)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    milestonesRef.current = milestones
  }, [milestones])

  useEffect(() => {
    efficiencyRef.current = efficiency
  }, [efficiency])

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const maxMessages = session.maxUserMessages
  const atMessageLimit = maxMessages != null && userMessageCount >= maxMessages

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, mentorHint])

  useEffect(() => {
    writeChatSession({
      trainerId: session.id,
      messages,
      efficiency,
      mentorHint,
      evaluations,
      milestones,
      hintOnDemand,
      hintsRemaining,
      goalModalSeen: !showGoalModal,
    })
  }, [
    session.id,
    messages,
    efficiency,
    mentorHint,
    evaluations,
    milestones,
    hintOnDemand,
    hintsRemaining,
    showGoalModal,
  ])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateKeyboardOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      setKeyboardOffset(offset)
    }

    updateKeyboardOffset()
    viewport.addEventListener('resize', updateKeyboardOffset)
    viewport.addEventListener('scroll', updateKeyboardOffset)
    return () => {
      viewport.removeEventListener('resize', updateKeyboardOffset)
      viewport.removeEventListener('scroll', updateKeyboardOffset)
    }
  }, [])

  const applyMentorHint = (response: AiTurnResponse) => {
    if (
      response.communication_efficiency < EFFICIENCY_HINT_THRESHOLD &&
      response.hint_from_mentor.tip
    ) {
      setMentorHint(response.hint_from_mentor)
    } else {
      setMentorHint(null)
    }
  }

  const completeSimulation = async (
    endReason: SimulationEndReason,
    currentEfficiency: number,
    currentEvaluations: SingleMessageEvaluation[],
  ) => {
    if (finishingRef.current) return
    finishingRef.current = true
    setIsLoading(true)
    setError(null)

    const currentMessages = messagesRef.current

    try {
      let finalSummary = null
      let finalEfficiency = currentEfficiency

      if (hasKey) {
        const response = await runSimulationTurn(apiKey, session, currentMessages, {
          userMessageIndex: currentMessages.filter((m) => m.role === 'user').length,
          isFinishing: true,
          endReason,
          milestones: isComprehensive ? milestonesRef.current : undefined,
          previousEfficiency: isComprehensive ? efficiencyRef.current : undefined,
        })
        finalSummary = response.final_summary
        finalEfficiency = response.communication_efficiency || currentEfficiency

        if (response.dialogue?.text?.trim()) {
          setMessages((prev) => appendAssistantMessage(prev, response))
        }
      }

      finishSimulation(
        buildSimulationResult(
          endReason,
          finalEfficiency,
          currentEvaluations,
          finalSummary,
          session,
          messagesRef.current,
        ),
      )
    } catch (err) {
      finishingRef.current = false
      setError(err instanceof Error ? err.message : 'Ошибка завершения симуляции')
      finishSimulation(
        buildSimulationResult(
          endReason,
          currentEfficiency,
          currentEvaluations,
          null,
          session,
          messagesRef.current,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const processAiResponse = (
    response: AiTurnResponse,
    updatedEvaluations: SingleMessageEvaluation[],
  ): { messagesAfterTurn: ChatMessage[]; autoHandled: boolean } => {
    setEfficiency(response.communication_efficiency)
    applyMentorHint(response)

    if (isComprehensive) {
      const merged = mergeMilestones(milestonesRef.current, response.milestones)
      milestonesRef.current = merged
      setMilestones(merged)
      if (response.hint_on_demand?.trim()) {
        setHintOnDemand(response.hint_on_demand.trim())
      }
    }

    let messagesAfterTurn = messagesRef.current
    setMessages((prev) => {
      messagesAfterTurn = appendAssistantMessage(prev, response)
      messagesRef.current = messagesAfterTurn
      return messagesAfterTurn
    })

    const shouldAutoComplete =
      response.is_auto_completed ||
      response.communication_efficiency >= EFFICIENCY_AUTO_COMPLETE

    if (shouldAutoComplete && response.final_summary) {
      setTimeout(() => {
        finishSimulation(
          buildSimulationResult(
            'auto',
            response.communication_efficiency,
            updatedEvaluations,
            response.final_summary,
            session,
            messagesAfterTurn,
          ),
        )
      }, 1200)
      return { messagesAfterTurn, autoHandled: true }
    }

    if (shouldAutoComplete) {
      void completeSimulation('auto', response.communication_efficiency, updatedEvaluations)
      return { messagesAfterTurn, autoHandled: true }
    }

    return { messagesAfterTurn, autoHandled: false }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading || atMessageLimit) return
    if (!hasKey) {
      setError('Тренажёр временно недоступен. Попробуйте позже.')
      return
    }

    const userMsg = createUserMessage(text)
    const messagesWithUser = [...messagesRef.current, userMsg]
    const nextUserIndex = userMessageCount + 1

    setMessages(messagesWithUser)
    messagesRef.current = messagesWithUser
    setInput('')
    setIsLoading(true)
    setError(null)
    setMentorHint(null)

    const applyTurnResponse = (response: AiTurnResponse) => {
      const updatedEvaluations = mergeEvaluations(
        evaluations,
        response.single_message_evaluations,
      )
      setEvaluations(updatedEvaluations)
      processAiResponse(response, updatedEvaluations)
    }

    if (containsProfanityOrAbuse(text)) {
      applyTurnResponse(buildProfanityHardStopResponse(session, text, nextUserIndex))
      setIsLoading(false)
      return
    }

    if (isComprehensive && isMeaninglessUserMessage(text)) {
      applyTurnResponse(
        buildMeaninglessMessageResponse(
          text,
          nextUserIndex,
          efficiencyRef.current,
          milestonesRef.current,
        ),
      )
      setIsLoading(false)
      return
    }

    try {
      const response = await runSimulationTurn(apiKey, session, messagesWithUser, {
        userMessageIndex: nextUserIndex,
        milestones: isComprehensive ? milestonesRef.current : undefined,
        previousEfficiency: isComprehensive ? efficiencyRef.current : undefined,
      })

      applyTurnResponse(response)

      const autoHandled =
        response.is_auto_completed ||
        response.communication_efficiency >= EFFICIENCY_AUTO_COMPLETE

      if (
        !autoHandled &&
        maxMessages != null &&
        nextUserIndex >= maxMessages
      ) {
        setTimeout(() => {
          void completeSimulation(
            'max_messages',
            response.communication_efficiency,
            mergeEvaluations(evaluations, response.single_message_evaluations),
          )
        }, 800)
      }
    } catch (err) {
      if (containsProfanityOrAbuse(text)) {
        applyTurnResponse(buildProfanityHardStopResponse(session, text, nextUserIndex))
        setError(null)
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка запроса к OpenRouter')
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
        messagesRef.current = messagesRef.current.filter((m) => m.id !== userMsg.id)
        setInput(text)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestHint = () => {
    if (!hintOnDemand.trim() || hintsRemaining <= 0 || isLoading) return
    setHintsRemaining((n) => n - 1)
    setShowHintModal(true)
  }

  const handleFinish = () => {
    void completeSimulation('manual', efficiency, evaluations)
  }

  return (
    <div
      className={`flex h-dvh max-h-dvh w-full flex-col ${
        isComprehensive
          ? 'max-w-none px-0 pt-[env(safe-area-inset-top)] pb-0 sm:max-w-xl sm:px-4 sm:pt-[max(0.75rem,env(safe-area-inset-top))] sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          : 'max-w-xl px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4'
      }`}
    >
      {!isComprehensive && (
        <button
          type="button"
          onClick={onBackToMenu}
          className="mb-2 w-fit shrink-0 cursor-pointer rounded-full border border-white/60 bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-[#7a5248] shadow-sm backdrop-blur-sm transition hover:bg-white/90 sm:mb-3"
        >
          ← В меню
        </button>
      )}

      {isComprehensive && (
        <button
          type="button"
          onClick={onBackToMenu}
          className="mb-2 hidden w-fit shrink-0 cursor-pointer rounded-full border border-white/60 bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-[#7a5248] shadow-sm backdrop-blur-sm transition hover:bg-white/90 sm:mb-3 sm:block"
        >
          ← В меню
        </button>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col ${
          isComprehensive
            ? 'rounded-none border-0 bg-white/55 shadow-none sm:rounded-3xl sm:border sm:border-white/60 sm:shadow-[0_8px_32px_rgba(255,180,140,0.18)] sm:backdrop-blur-md'
            : 'rounded-3xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(255,180,140,0.18)] backdrop-blur-md'
        }`}
      >
        {isComprehensive ? (
          <>
            {/* Mobile messenger header */}
            <header className="sticky top-0 z-10 shrink-0 border-b border-white/50 bg-white/90 px-3 py-2 backdrop-blur-md sm:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg text-[#7a5248] transition hover:bg-white/70"
                  aria-label="В меню"
                >
                  ←
                </button>
                {maxMessages != null && (
                  <MessageCounterBadge
                    current={userMessageCount}
                    max={maxMessages}
                    size="large"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <EfficiencyBar value={efficiency} compact />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMilestones((v) => !v)}
                  className="shrink-0 cursor-pointer rounded-full bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold text-[#8b635a] transition hover:bg-white"
                >
                  Этапы {showMobileMilestones ? '▲' : '▼'}
                </button>
              </div>
              {showMobileMilestones && <MilestonesChips milestones={milestones} />}
            </header>

            {/* Desktop header */}
            <div className="hidden shrink-0 border-b border-white/50 px-5 py-4 sm:block">
              <div className="flex items-center justify-between gap-3">
                {maxMessages != null && (
                  <MessageCounterBadge current={userMessageCount} max={maxMessages} />
                )}
                <p className="text-xs text-[#a07068]">сообщений отправлено</p>
              </div>
              <EfficiencyBar value={efficiency} />
              <MilestonesPanel milestones={milestones} />
            </div>
          </>
        ) : (
          <div className="shrink-0 border-b border-white/50 px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {Avatars.map((Avatar, i) => (
                  <div key={i} className="origin-bottom scale-75">
                    <Avatar />
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#c49080]">
                  {session.mentorLabel}
                </p>
                <h2 className="truncate text-base font-bold text-[#5c4033] sm:text-lg">
                  {session.title}
                </h2>
                {maxMessages != null && (
                  <p className="mt-0.5 text-xs text-[#a07068]">
                    Сообщений: {userMessageCount}/{maxMessages}
                  </p>
                )}
              </div>
            </div>
            <EfficiencyBar value={efficiency} />
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <p className="text-xs font-medium text-[#c49080]">Собеседник печатает…</p>
          )}
        </div>

        {mentorHint?.tip && efficiency < EFFICIENCY_HINT_THRESHOLD && (
          <div
            className={`mx-3 mb-2 rounded-2xl border border-[#a8d5a0]/50 bg-[#f0faf0]/90 px-3 py-2 sm:mx-5 sm:mb-3 sm:px-4 sm:py-3 ${
              isComprehensive ? 'max-sm:mx-2 max-sm:rounded-xl max-sm:py-2' : ''
            }`}
          >
            <p className="text-[11px] font-bold text-[#4a6b45] sm:text-xs">
              Подсказка · {mentorHint.mentor_name ?? session.mentorLabel}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#4a6b45] sm:mt-1 sm:text-sm">
              {mentorHint.tip}
            </p>
          </div>
        )}

        {error && (
          <p className="mx-3 mb-1 text-xs text-[#8b5050] sm:mx-5 sm:mb-2">{error}</p>
        )}

        {/* Mobile Telegram-style composer (comprehensive) */}
        {isComprehensive && (
          <div
            className="shrink-0 border-t border-white/50 bg-white/90 px-2 pt-2 backdrop-blur-md sm:hidden"
            style={{
              paddingBottom: `max(0.5rem, calc(env(safe-area-inset-bottom) + ${keyboardOffset}px))`,
            }}
          >
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={
                  isLoading ||
                  hintsRemaining <= 0 ||
                  !hintOnDemand.trim() ||
                  atMessageLimit
                }
                className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Подсказка, осталось ${hintsRemaining}`}
              >
                💡
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={atMessageLimit ? 'Лимит сообщений' : 'Сообщение...'}
                disabled={isLoading || atMessageLimit}
                className="min-w-0 flex-1 rounded-3xl border border-white/70 bg-white/80 px-4 py-2.5 text-base text-[#5c4033] outline-none placeholder:text-[#c4a090] focus:border-[#ffc9b5] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || atMessageLimit || !hasKey}
                className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] text-lg font-bold text-[#6b4540] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Отправить"
              >
                ↑
              </button>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isLoading}
              className="mt-1.5 w-full cursor-pointer py-1 text-center text-[11px] font-medium text-[#a07068] transition hover:text-[#7a5248] disabled:opacity-50"
            >
              Завершить тренировку
            </button>
          </div>
        )}

        {/* Desktop / non-comprehensive composer */}
        <div
          className={`shrink-0 border-t border-white/50 px-3 py-3 sm:px-5 ${
            isComprehensive ? 'hidden sm:block' : ''
          }`}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={
                atMessageLimit ? 'Лимит сообщений достигнут' : 'Напишите ответ...'
              }
              disabled={isLoading || atMessageLimit}
              className="min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 text-base text-[#5c4033] outline-none placeholder:text-[#c4a090] focus:border-[#ffc9b5] disabled:opacity-60 sm:px-4 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || atMessageLimit || !hasKey}
              className="shrink-0 cursor-pointer rounded-2xl bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-3 py-2.5 text-xs font-bold text-[#6b4540] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              Отправить
            </button>
          </div>
          {isComprehensive && (
            <button
              type="button"
              onClick={handleRequestHint}
              disabled={
                isLoading ||
                hintsRemaining <= 0 ||
                !hintOnDemand.trim() ||
                atMessageLimit
              }
              className="mt-2 w-full cursor-pointer rounded-full border border-[#a8d5a0]/60 bg-[#f0faf0]/80 py-2 text-sm font-semibold text-[#4a6b45] transition hover:bg-[#f0faf0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              💡 Подсказка (осталось {hintsRemaining})
            </button>
          )}
          <button
            type="button"
            onClick={handleFinish}
            disabled={isLoading}
            className="mt-3 w-full cursor-pointer rounded-full border border-white/70 bg-white/60 py-2.5 text-sm font-semibold text-[#7a5248] transition hover:bg-white/80 disabled:opacity-50"
          >
            Завершить тренировку
          </button>
        </div>
      </div>

      {showHintModal && hintOnDemand && (
        <HintModal
          mentor={getActiveMentorForHint(milestones)}
          hint={hintOnDemand}
          onClose={() => setShowHintModal(false)}
        />
      )}

      {showGoalModal && isComprehensive && maxMessages != null && (
        <GoalIntroModal
          maxMessages={maxMessages}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </div>
  )
}
