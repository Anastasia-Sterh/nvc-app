import { motion } from 'framer-motion'

export function MentorAvatar() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-[0_4px_20px_rgba(255,180,140,0.4)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #fff5e6 0%, #ffd4a8 45%, #ffb8c9 85%)',
        }}
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          <ellipse cx="18" cy="22" rx="9" ry="11" fill="#f4a896" opacity="0.85" />
          <ellipse cx="46" cy="22" rx="9" ry="11" fill="#f4a896" opacity="0.85" />
          <ellipse cx="18" cy="24" rx="5" ry="6" fill="#ffc9b5" />
          <ellipse cx="46" cy="24" rx="5" ry="6" fill="#ffc9b5" />
          <circle cx="32" cy="36" r="20" fill="#f8c4aa" />
          <ellipse cx="25" cy="35" rx="3" ry="4" fill="#5c4033" />
          <ellipse cx="39" cy="35" rx="3" ry="4" fill="#5c4033" />
          <circle cx="26" cy="34" r="1" fill="white" />
          <circle cx="40" cy="34" r="1" fill="white" />
          <ellipse cx="32" cy="41" rx="2.5" ry="2" fill="#e8879a" />
          <path
            d="M 32 43 Q 28 46 26 44 M 32 43 Q 36 46 38 44"
            stroke="#c9757a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <line x1="10" y1="38" x2="20" y2="37" stroke="#d4a090" strokeWidth="0.8" />
          <line x1="10" y1="42" x2="20" y2="42" stroke="#d4a090" strokeWidth="0.8" />
          <line x1="44" y1="37" x2="54" y2="38" stroke="#d4a090" strokeWidth="0.8" />
          <line x1="44" y1="42" x2="54" y2="42" stroke="#d4a090" strokeWidth="0.8" />
        </svg>

        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border-2 border-white/50"
        />
      </motion.div>

      <span className="text-xs font-semibold text-[#a07068]">Мурчик</span>
    </div>
  )
}
