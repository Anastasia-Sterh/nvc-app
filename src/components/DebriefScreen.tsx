import { motion } from 'framer-motion'
import type { SimulationResult, TrainerSessionConfig } from '../types/trainer'

interface DebriefScreenProps {
  session: TrainerSessionConfig
  result?: SimulationResult | null
  onBackToMenu: () => void
  onRetry: () => void
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ffe08a] to-[#ffb8c9] text-xl font-bold text-[#5c4033] shadow-sm">
      {Math.round(score)}
    </div>
  )
}

export function DebriefScreen({
  session,
  result,
  onBackToMenu,
  onRetry,
}: DebriefScreenProps) {
  const summary = result?.finalSummary
  const evaluations = result?.messageEvaluations ?? []
  const overallScore = summary?.overall_score ?? session.debrief.score

  return (
    <div className="flex min-h-screen w-full justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_12px_40px_rgba(255,180,140,0.22)] backdrop-blur-md sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c49080]">
          Совет наставников
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#5c4033]">{session.title}</h1>

        <div className="mt-5 flex items-center gap-4">
          <ScoreBadge score={overallScore} />
          <div>
            <p className="text-sm font-semibold text-[#7a5248]">Общий балл</p>
            <p className="text-xs text-[#a07068]">из 100 · эффективность коммуникации</p>
          </div>
        </div>

        {summary ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#c49080]">Мурчик · ННО</p>
              <p className="mt-1 text-sm leading-relaxed text-[#6b4540]">
                {summary.murchik_final_feedback}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#c49080]">Арни · Переговоры</p>
              <p className="mt-1 text-sm leading-relaxed text-[#6b4540]">
                {summary.arni_final_feedback}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#c49080]">Бьерн · DEAR MAN</p>
              <p className="mt-1 text-sm leading-relaxed text-[#6b4540]">
                {summary.bjorn_final_feedback}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-[#6b4540]">{session.debrief.summary}</p>
        )}

        {evaluations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#c49080]">
              Разбор по сообщениям
            </h2>
            <div className="mt-3 space-y-4">
              {evaluations.map((ev) => (
                <article
                  key={ev.user_message_index}
                  className="rounded-2xl border border-white/60 bg-white/50 px-4 py-4"
                >
                  <p className="text-xs font-bold text-[#a07068]">
                    Сообщение {ev.user_message_index}
                  </p>
                  <blockquote className="mt-2 border-l-4 border-[#ffc9b5] pl-3 text-sm italic text-[#5c4033]">
                    «{ev.user_message_text}»
                  </blockquote>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#fff9f2] p-3">
                      <p className="text-xs font-bold text-[#c49080]">
                        ННО · {ev.murchik_nvo_score}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6b4540]">
                        {ev.murchik_comment}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#fff9f2] p-3">
                      <p className="text-xs font-bold text-[#c49080]">
                        Переговоры · {ev.arni_harvard_score}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6b4540]">
                        {ev.arni_comment}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#fff9f2] p-3">
                      <p className="text-xs font-bold text-[#c49080]">
                        DEAR MAN · {ev.bjorn_dearman_score}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6b4540]">
                        {ev.bjorn_comment}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

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
