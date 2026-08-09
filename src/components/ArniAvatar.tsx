import { motion } from 'framer-motion'

export function ArniAvatar() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-[0_4px_20px_rgba(201,109,69,0.35)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #fff5eb 0%, #ffe4c4 45%, #e8a87c 85%)',
        }}
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
          {/* ears */}
          <path d="M 18 22 L 12 8 L 26 18 Z" fill="#c96d45" opacity="0.9" />
          <path d="M 19 21 L 14 12 L 24 19 Z" fill="#ffe4c4" />
          <path d="M 46 22 L 52 8 L 38 18 Z" fill="#c96d45" opacity="0.9" />
          <path d="M 45 21 L 50 12 L 40 19 Z" fill="#ffe4c4" />
          {/* head */}
          <ellipse cx="32" cy="36" rx="19" ry="18" fill="#e8a87c" />
          {/* sweater collar */}
          <path
            d="M 16 48 Q 32 42 48 48 L 48 56 Q 32 52 16 56 Z"
            fill="#b85c38"
          />
          <path
            d="M 18 49 Q 32 44 46 49 L 44 54 Q 32 50 20 54 Z"
            fill="#d4845c"
          />
          {/* sweater body peek */}
          <ellipse cx="32" cy="52" rx="14" ry="6" fill="#c96d45" />
          {/* face markings */}
          <ellipse cx="32" cy="38" rx="12" ry="11" fill="#f0b878" />
          {/* eyes — wise */}
          <ellipse cx="25" cy="35" rx="2.8" ry="3.2" fill="#4a3020" />
          <ellipse cx="39" cy="35" rx="2.8" ry="3.2" fill="#4a3020" />
          <circle cx="26" cy="34" r="0.9" fill="white" />
          <circle cx="40" cy="34" r="0.9" fill="white" />
          {/* snout */}
          <ellipse cx="32" cy="41" rx="5" ry="4" fill="#ffe4c4" />
          <ellipse cx="32" cy="40" rx="2" ry="1.5" fill="#5c3d2e" />
          {/* smile — constructive */}
          <path
            d="M 27 43 Q 32 46 37 43"
            stroke="#5c3d2e"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          {/* glasses hint — subtle strategist */}
          <circle cx="25" cy="35" r="5" fill="none" stroke="#8b5a3c" strokeWidth="0.8" opacity="0.5" />
          <circle cx="39" cy="35" r="5" fill="none" stroke="#8b5a3c" strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="35" x2="34" y2="35" stroke="#8b5a3c" strokeWidth="0.8" opacity="0.5" />
        </svg>

        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border-2 border-white/50"
        />
      </motion.div>

      <span className="text-xs font-semibold text-[#b8734a]">Арни</span>
    </div>
  )
}
