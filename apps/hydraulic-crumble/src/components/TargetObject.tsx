import { motion } from 'framer-motion'
import type { CrushObject } from '../store/useCrushStore'

interface TargetObjectProps {
  object: CrushObject
  crushing: boolean
}

export function TargetObject({ object, crushing }: TargetObjectProps) {
  const rounded =
    object.type === 'bathbomb'
      ? 'rounded-[42%]'
      : object.type === 'sand'
        ? 'rounded-[1.4rem]'
        : 'rounded-2xl'

  const surface =
    object.type === 'chalk'
      ? `linear-gradient(145deg, #f4eadb 0%, ${object.color} 42%, #cbb79a 100%)`
      : object.type === 'bathbomb'
        ? `radial-gradient(circle at 32% 28%, #e8b6a6 0%, ${object.color} 46%, #8f4d42 100%)`
        : `linear-gradient(160deg, #e0c08a 0%, ${object.color} 38%, #8a6a3e 100%)`

  return (
    <motion.div
      layout={false}
      className={`relative h-24 w-36 sm:h-28 sm:w-40 ${rounded}`}
      initial={{ x: 160, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        scaleX: crushing ? 1.16 : [1, 1.03, 1],
        scaleY: crushing ? 0.42 : [1, 1.02, 1],
        y: crushing ? 10 : [0, -4, 0],
      }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={
        crushing
          ? { duration: 0.16, ease: [0.7, 0.05, 0.9, 0.2] }
          : {
              x: { duration: 0.55, ease: [0.22, 0.8, 0.36, 1] },
              opacity: { duration: 0.4 },
              scaleX: { duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
              scaleY: { duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
              y: { duration: 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
            }
      }
      style={{
        background: surface,
        boxShadow: `
          inset 6px 8px 14px rgba(255, 244, 228, 0.28),
          inset -8px -10px 16px ${object.shadowColor}88,
          0 14px 22px ${object.shadowColor}66,
          0 2px 0 ${object.shadowColor}
        `,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-[12%] opacity-40 ${rounded}`}
        style={{
          background:
            object.type === 'bathbomb'
              ? 'radial-gradient(circle at 30% 30%, rgba(255,236,220,0.7), transparent 55%)'
              : 'linear-gradient(120deg, rgba(255,246,230,0.55), transparent 50%)',
        }}
      />
      {object.type === 'sand' ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.4rem] opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 7px, rgba(80,50,24,0.18) 7px 8px)',
          }}
        />
      ) : null}
    </motion.div>
  )
}
