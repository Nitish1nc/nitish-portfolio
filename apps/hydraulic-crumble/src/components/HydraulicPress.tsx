import { motion } from 'framer-motion'

interface HydraulicPressProps {
  travel: number
  isDown: boolean
  onImpact: () => void
}

export function HydraulicPress({ travel, isDown, onImpact }: HydraulicPressProps) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 z-20 flex flex-col items-center"
      animate={{ y: isDown ? travel : 0 }}
      transition={
        isDown
          ? { duration: 0.16, ease: [0.7, 0.0, 0.95, 0.2] }
          : { duration: 0.9, ease: [0.22, 0.8, 0.36, 1] }
      }
      onAnimationComplete={() => {
        if (isDown) onImpact()
      }}
    >
      <div className="flex w-full justify-center gap-16">
        <div
          className="h-16 w-7 rounded-b-md sm:h-20"
          style={{
            background:
              'linear-gradient(90deg, #2a2a2a 0%, #6d6a66 32%, #9a9690 50%, #4a4844 100%)',
            boxShadow: 'inset 2px 0 4px rgba(255,255,255,0.18), 0 8px 12px rgba(0,0,0,0.45)',
          }}
        />
        <div
          className="h-16 w-7 rounded-b-md sm:h-20"
          style={{
            background:
              'linear-gradient(90deg, #2a2a2a 0%, #6d6a66 32%, #9a9690 50%, #4a4844 100%)',
            boxShadow: 'inset 2px 0 4px rgba(255,255,255,0.18), 0 8px 12px rgba(0,0,0,0.45)',
          }}
        />
      </div>
      <div
        className="relative h-16 w-[78%] max-w-sm rounded-[1.15rem] sm:h-[4.4rem]"
        style={{
          background:
            'linear-gradient(180deg, #5c5954 0%, #3a3834 42%, #1f1e1c 100%)',
          boxShadow: `
            inset 0 8px 10px rgba(220, 210, 196, 0.22),
            inset 0 -10px 14px rgba(0,0,0,0.55),
            0 18px 24px rgba(0,0,0,0.5)
          `,
        }}
      >
        <div className="absolute inset-x-5 top-2 h-2 rounded-full bg-[#d7cfc4]/20" />
        <div className="absolute inset-x-8 bottom-2 flex justify-between">
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #b9b3aa, #4a4742)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </div>
      <div
        className="h-3 w-[70%] max-w-xs rounded-b-lg"
        style={{
          background: 'linear-gradient(180deg, #2c2a27, #121110)',
          boxShadow: '0 6px 10px rgba(0,0,0,0.45)',
        }}
      />
    </motion.div>
  )
}
