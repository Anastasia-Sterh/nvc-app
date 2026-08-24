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
  dialogueToChatMessage,
  EFFICIENCY_AUTO_COMPLETE,
  EFFICIENCY_HINT_THRESHOLD,
} from '../services/trainerSimulation'
import type {
  AiTurnResponse,
  ChatMessage,
  SimulationEndReason,
  SimulationResult,
  SingleMessageEvaluation,
  TrainerSessionConfig,
} from '../types/trainer'

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

function EfficiencyBar({ value }: { value: number }) {
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
  const { apiKey, hasKey, persistKey, envKeyPresent } = useOpenRouterKey()

  const [messages, setMessages] = useState<ChatMessage[]>(
    session.initialMessages.filter((m) => m.role === 'assistant'),
  )
  const [input, setInput] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [efficiency, setEfficiency] = useState(0)
  const [mentorHint, setMentorHint] = useState<AiTurnResponse['hint_from_mentor'] | null>(
    null,
  )
  const [evaluations, setEvaluations] = useState<SingleMessageEvaluation[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const finishingRef = useRef(false)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const maxMessages = session.maxUserMessages
  const atMessageLimit = maxMessages != null && userMessageCount >= maxMessages

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, mentorHint])

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
        })
        finalSummary = response.final_summary
        finalEfficiency = response.communication_efficiency || currentEfficiency

        if (response.dialogue?.text?.trim()) {
          setMessages((prev) => appendAssistantMessage(prev, response))
        }
      }

      onFinish(
        buildSimulationResult(
          endReason,
          finalEfficiency,
          currentEvaluations,
          finalSummary,
          session,
        ),
      )
    } catch (err) {
      finishingRef.current = false
      setError(err instanceof Error ? err.message : 'Ошибка завершения симуляции')
      onFinish(
        buildSimulationResult(endReason, currentEfficiency, currentEvaluations, null, session),
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
        onFinish(
          buildSimulationResult(
            'auto',
            response.communication_efficiency,
            updatedEvaluations,
            response.final_summary,
            session,
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
      setError('Укажите OpenRouter API ключ для начала диалога')
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

    try {
      const response = await runSimulationTurn(apiKey, session, messagesWithUser, {
        userMessageIndex: nextUserIndex,
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

  const handleFinish = () => {
    void completeSimulation('manual', efficiency, evaluations)
  }

  const handleSaveKey = () => {
    if (!keyInput.trim()) return
    persistKey(keyInput)
    setKeyInput('')
    setError(null)
  }

  return (
    <div className="flex min-h-screen w-full max-w-xl flex-col px-4 pb-4 pt-4">
      <button
        type="button"
        onClick={onBackToMenu}
        className="mb-3 w-fit cursor-pointer rounded-full border border-white/60 bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-[#7a5248] shadow-sm backdrop-blur-sm transition hover:bg-white/90"
      >
        ← В меню
      </button>

      {!hasKey && (
        <div className="mb-3 rounded-2xl border border-[#ffc9b5]/60 bg-white/80 p-4">
          <p className="text-sm font-semibold text-[#5c4033]">OpenRouter API ключ</p>
          <p className="mt-1 text-xs leading-relaxed text-[#8b635a]">
            {envKeyPresent
              ? 'Ключ из .env не найден. Введите ключ вручную или добавьте VITE_OPENROUTER_API_KEY в .env'
              : 'Получите ключ на openrouter.ai/keys или добавьте VITE_OPENROUTER_API_KEY в .env'}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-..."
              className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-[#ffc9b5]"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-[#ffe08a] to-[#ffb8c9] px-4 py-2 text-sm font-bold text-[#6b4540]"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(255,180,140,0.18)] backdrop-blur-md">
        <div className="border-b border-white/50 px-4 py-4 sm:px-5">
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

        <div
          ref={scrollRef}
          className="flex max-h-[calc(100vh-22rem)] min-h-[18rem] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <p className="text-xs font-medium text-[#c49080]">Собеседник печатает…</p>
          )}
        </div>

        {mentorHint?.tip && efficiency < EFFICIENCY_HINT_THRESHOLD && (
          <div className="mx-4 mb-3 rounded-2xl border border-[#a8d5a0]/50 bg-[#f0faf0]/90 px-4 py-3 sm:mx-5">
            <p className="text-xs font-bold text-[#4a6b45]">
              Подсказка · {mentorHint.mentor_name ?? session.mentorLabel}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#4a6b45]">{mentorHint.tip}</p>
          </div>
        )}

        {error && (
          <p className="mx-4 mb-2 text-xs text-[#8b5050] sm:mx-5">{error}</p>
        )}

        <div className="border-t border-white/50 px-4 py-3 sm:px-5">
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
              className="min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm text-[#5c4033] outline-none placeholder:text-[#c4a090] focus:border-[#ffc9b5] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || atMessageLimit || !hasKey}
              className="shrink-0 cursor-pointer rounded-2xl bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-4 py-2.5 text-sm font-bold text-[#6b4540] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
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
    </div>
  )
}
