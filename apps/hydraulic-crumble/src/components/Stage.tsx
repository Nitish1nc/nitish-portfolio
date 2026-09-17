import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useCrushStore } from '../store/useCrushStore'
import { ConveyorBelt } from './ConveyorBelt'
import { HydraulicPress } from './HydraulicPress'
import { ParticleCanvas } from './ParticleCanvas'
import { TargetObject } from './TargetObject'

export function Stage() {
  const currentObject = useCrushStore((s) => s.currentObject)
  const isSmashing = useCrushStore((s) => s.isSmashing)
  const particles = useCrushStore((s) => s.particles)
  const impact = useCrushStore((s) => s.impact)
  const stageRef = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(220)
  const [shake, setShake] = useState({ x: 0, y: 0 })
  const [flash, setFlash] = useState(false)

  const crushing = isSmashing && particles.length === 0
  const objectVisible = particles.length === 0

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      setTravel(Math.max(180, el.clientHeight * 0.62))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (particles.length === 0) return
    const dir = () => (Math.random() > 0.5 ? 1 : -1)
    setShake({ x: dir() * (2 + Math.random()), y: dir() * (2 + Math.random()) })
    setFlash(true)
    const shakeTimer = window.setTimeout(() => setShake({ x: 0, y: 0 }), 100)
    const flashTimer = window.setTimeout(() => setFlash(false), 180)
    return () => {
      window.clearTimeout(shakeTimer)
      window.clearTimeout(flashTimer)
    }
  }, [particles])

  return (
    <motion.div
      ref={stageRef}
      className="relative h-[70%] w-full overflow-hidden"
      animate={{ x: shake.x, y: shake.y }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        animate={{
          boxShadow: flash
            ? 'inset 0 0 80px rgba(232, 180, 122, 0.28)'
            : 'inset 0 0 0 rgba(232, 180, 122, 0)',
        }}
        transition={{ duration: 0.18 }}
      />

      <div
        className="absolute inset-x-0 top-0 z-20 h-5"
        style={{
          background: 'linear-gradient(180deg, #3f3c38 0%, #1c1b19 100%)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
        }}
      />
      <HydraulicPress travel={travel} isDown={crushing} onImpact={impact} />

      <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center">
        <AnimatePresence mode="wait">
          {objectVisible ? (
            <TargetObject key={currentObject.id} object={currentObject} crushing={crushing} />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-0">
        <ConveyorBelt />
      </div>

      <ParticleCanvas particles={particles} />
    </motion.div>
  )
}
