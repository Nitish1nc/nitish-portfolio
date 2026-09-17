import { motion } from 'framer-motion'
import type { CrushParticle } from '../store/useCrushStore'

interface ParticleCanvasProps {
  particles: CrushParticle[]
}

export function ParticleCanvas({ particles }: ParticleCanvasProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-[3px]"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(62% + ${particle.y}px)`,
            width: particle.size,
            height: particle.size * 0.72,
            marginLeft: -particle.size / 2,
            background: particle.color,
            boxShadow: `inset 1px 1px 2px rgba(255,246,230,0.35), 0 2px 4px rgba(0,0,0,0.35)`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: particle.vx,
            y: particle.vy + 200,
            opacity: 0,
            scale: 0.2,
            rotate: (particle.id * 137) % 360,
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
