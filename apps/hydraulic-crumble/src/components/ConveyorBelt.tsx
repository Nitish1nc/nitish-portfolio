import { motion } from 'framer-motion'

export function ConveyorBelt() {
  return (
    <div className="relative h-16 w-full overflow-hidden rounded-t-[1.6rem]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #3a2a20 0%, #241910 38%, #1a120d 100%)',
          boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.45), 0 -8px 18px rgba(0,0,0,0.35)',
        }}
      />
      <motion.div
        className="absolute -left-1/2 top-2 h-8 w-[200%]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #2c2118 0 18px, #3d2d22 18px 22px, #4a382a 22px 26px, #2c2118 26px 44px)',
          boxShadow: 'inset 0 2px 0 rgba(201, 148, 96, 0.18)',
        }}
        animate={{ x: ['0%', '-25%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-x-6 bottom-1.5 flex justify-between">
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #c9a07a, #6a4a32 55%, #2a1b12)',
              boxShadow: 'inset 0 1px 1px rgba(255,230,200,0.35), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
