import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import type { ChatMessage, TrainerSessionConfig } from '../types/trainer'

interface ChatTrainerProps {
  session: TrainerSessionConfig
  Avatars: ComponentType[]
  onFinish: () => void
  onBackToMenu: () => void
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isMentor = message.role === 'mentor'

  let bubbleClass =
    'rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#fff9f2] to-[#ffe8d6] text-[#6b4540]'
  if (isUser) {
    bubbleClass =
      'rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#ffe08a] to-[#ffc9b5] text-[#5c4033] ml-auto'
  }
  if (isMentor) {
    bubbleClass =
      'rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#f0faf0] to-[#e8f5e4] text-[#4a6b45] border border-[#a8d5a0]/40'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}
    >
      {message.senderName && !isUser && (
        <p className="mb-1 text-xs font-semibold text-[#a07068]">
          {message.senderName}
        </p>
      )}
      <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${bubbleClass}`}>
        {message.text}
      </div>
    </motion.div>
  )
}

export function ChatTrainer({
  session,
  Avatars,
  onFinish,
  onBackToMenu,
}: ChatTrainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(session.initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const hint: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'mentor',
        text: 'Хороший ход! Попробуй добавить конкретику — факт, чувство или чёткую просьбу.',
        senderName: session.mentorLabel,
      }
      setMessages((prev) => [...prev, hint])
      setIsTyping(false)
    }, 900)
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

      <div className="rounded-3xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(255,180,140,0.18)] backdrop-blur-md">
        <div className="border-b border-white/50 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {Avatars.map((Avatar, i) => (
                <div key={i} className="scale-75 origin-bottom">
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
              <p className="mt-0.5 text-xs leading-snug text-[#8b635a] sm:text-sm">
                {session.topic}
              </p>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-[calc(100vh-18rem)] min-h-[20rem] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5 sm:min-h-[24rem]"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <p className="text-xs font-medium text-[#c49080]">
              {session.mentorLabel} печатает…
            </p>
          )}
        </div>

        <div className="border-t border-white/50 px-4 py-3 sm:px-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Напишите ответ..."
              className="min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm text-[#5c4033] outline-none placeholder:text-[#c4a090] focus:border-[#ffc9b5] focus:ring-2 focus:ring-[#ffc9b5]/30"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="shrink-0 cursor-pointer rounded-2xl bg-gradient-to-r from-[#ffe08a] via-[#ffc9b5] to-[#ffb8c9] px-4 py-2.5 text-sm font-bold text-[#6b4540] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
          <button
            type="button"
            onClick={onFinish}
            className="mt-3 w-full cursor-pointer rounded-full border border-white/70 bg-white/60 py-2.5 text-sm font-semibold text-[#7a5248] transition hover:bg-white/80"
          >
            Завершить тренировку
          </button>
        </div>
      </div>
    </div>
  )
}
