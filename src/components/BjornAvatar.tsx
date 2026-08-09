import { motion } from 'framer-motion'

export function BjornAvatar() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-[0_4px_20px_rgba(139,105,64,0.35)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #faf6f0 0%, #e8dcc8 45%, #c4a574 85%)',
        }}
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          {/* ears */}
          <circle cx="18" cy="22" r="7" fill="#a08050" />
          <circle cx="18" cy="22" r="4.5" fill="#d4b896" />
          <circle cx="46" cy="22" r="7" fill="#a08050" />
          <circle cx="46" cy="22" r="4.5" fill="#d4b896" />
          {/* head */}
          <ellipse cx="32" cy="34" rx="20" ry="19" fill="#c4a574" />
          {/* muzzle */}
          <ellipse cx="32" cy="38" rx="11" ry="9" fill="#e8dcc8" />
          {/* eyes — calm confidence */}
          <ellipse cx="25" cy="32" rx="2.5" ry="3" fill="#3d2e1f" />
          <ellipse cx="39" cy="32" rx="2.5" ry="3" fill="#3d2e1f" />
          <circle cx="26" cy="31" r="0.8" fill="white" />
          <circle cx="40" cy="31" r="0.8" fill="white" />
          {/* nose */}
          <ellipse cx="32" cy="37" rx="3" ry="2.2" fill="#5c4030" />
          {/* gentle smile */}
          <path
            d="M 27 40 Q 32 43 37 40"
            stroke="#5c4030"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          {/* scarf — cozy boundary keeper */}
          <path
            d="M 14 46 Q 32 40 50 46 L 50 54 Q 32 50 14 54 Z"
            fill="#8b6914"
          />
          <path
            d="M 16 47 Q 32 42 48 47 L 46 52 Q 32 48 18 52 Z"
            fill="#a08050"
          />
        </svg>

        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border-2 border-white/50"
        />
      </motion.div>

      <span className="text-xs font-semibold text-[#8b6914]">Бьерн</span>
    </div>
  )
}
