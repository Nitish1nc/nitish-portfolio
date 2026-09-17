import { motion } from 'framer-motion'
import { useCrushStore } from '../store/useCrushStore'

export function SmashButton() {
  const isSmashing = useCrushStore((s) => s.isSmashing)
  const unlockAudio = useCrushStore((s) => s.unlockAudio)
  const triggerSmash = useCrushStore((s) => s.triggerSmash)

  const smash = () => {
    unlockAudio()
    triggerSmash()
  }

  return (
    <div className="flex h-[30%] w-full items-center justify-center px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
      <motion.button
        type="button"
        aria-label="CRUSH"
        aria-disabled={isSmashing}
        onPointerDown={smash}
        onClick={smash}
        className="relative h-[20dvh] w-[min(86vw,22rem)] max-h-36 cursor-pointer rounded-[2.2rem] font-sans text-3xl font-extrabold tracking-[0.28em] text-[#2a1b12] touch-manipulation"
        style={{
          background:
            'linear-gradient(180deg, #e8b48a 0%, #c97b50 48%, #9a5536 100%)',
          opacity: isSmashing ? 0.82 : 1,
          boxShadow: `
            0 0 28px rgba(201, 123, 80, 0.45),
            inset 0 8px 10px rgba(255, 236, 214, 0.35),
            inset 0 -10px 14px rgba(90, 40, 22, 0.35),
            0 14px 0 #6a3a24
          `,
        }}
        animate={{
          boxShadow: [
            '0 0 22px rgba(201,123,80,0.32), inset 0 8px 10px rgba(255,236,214,0.35), inset 0 -10px 14px rgba(90,40,22,0.35), 0 14px 0 #6a3a24',
            '0 0 42px rgba(201,123,80,0.58), inset 0 8px 10px rgba(255,236,214,0.4), inset 0 -10px 14px rgba(90,40,22,0.35), 0 14px 0 #6a3a24',
            '0 0 22px rgba(201,123,80,0.32), inset 0 8px 10px rgba(255,236,214,0.35), inset 0 -10px 14px rgba(90,40,22,0.35), 0 14px 0 #6a3a24',
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        whileTap={{ scale: 0.95, y: 8 }}
      >
        <span className="relative z-10 drop-shadow-[0_1px_0_rgba(255,236,214,0.45)]">CRUSH</span>
      </motion.button>
    </div>
  )
}
