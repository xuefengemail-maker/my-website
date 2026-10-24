import { useEffect, useRef } from 'react'
import { useTheme } from '../theme/useTheme.ts'

const MAX_DPR = 2
const MAX_PARTICLES = 80
const PARTICLE_FALLBACK_COLOR = 'rgb(148 163 184 / 0.6)'

type Particle = {
  x: number
  y: number
  radius: number
  velocityX: number
  velocityY: number
}

function getParticleCount(width: number, height: number): number {
  const baseCount = Math.min(
    MAX_PARTICLES,
    Math.floor((width * height) / 18000),
  )

  if (width < 640) {
    return Math.max(12, Math.floor(baseCount / 2))
  }

  return Math.max(24, baseCount)
}

function createParticles(width: number, height: number): Particle[] {
  return Array.from({ length: getParticleCount(width, height) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.6 + Math.random() * 1.4,
    velocityX: (Math.random() - 0.5) * 0.12,
    velocityY: (Math.random() - 0.5) * 0.12,
  }))
}

function readParticleColor(): string {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--hero-particle')
    .trim()

  return value || PARTICLE_FALLBACK_COLOR
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawFrameRef = useRef<() => void>(() => {})
  const colorRef = useRef(PARTICLE_FALLBACK_COLOR)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current

    if (canvas === null) {
      return
    }

    const context = canvas.getContext('2d')

    if (context === null) {
      return
    }

    let motionQuery: MediaQueryList | null = null

    try {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {
      motionQuery = null
    }

    const shouldReduceMotion = () =>
      motionQuery === null || motionQuery.matches

    let particles: Particle[] = []
    let width = 1
    let height = 1
    let frameId = 0

    const drawFrame = () => {
      context.clearRect(0, 0, width, height)
      context.fillStyle = colorRef.current

      for (const particle of particles) {
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      }
    }

    drawFrameRef.current = drawFrame

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = createParticles(width, height)
    }

    const stop = () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
        frameId = 0
      }
    }

    const step = () => {
      for (const particle of particles) {
        particle.x += particle.velocityX
        particle.y += particle.velocityY

        if (particle.x < -10) {
          particle.x = width + 10
        } else if (particle.x > width + 10) {
          particle.x = -10
        }

        if (particle.y < -10) {
          particle.y = height + 10
        } else if (particle.y > height + 10) {
          particle.y = -10
        }
      }

      drawFrame()
      frameId = window.requestAnimationFrame(step)
    }

    const start = () => {
      stop()

      if (shouldReduceMotion() || document.hidden) {
        drawFrame()
        return
      }

      frameId = window.requestAnimationFrame(step)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        start()
      }
    }

    const handleMotionChange = () => {
      start()
    }

    const observer = new ResizeObserver(() => {
      resize()

      if (shouldReduceMotion() || document.hidden) {
        drawFrame()
      }
    })

    colorRef.current = readParticleColor()
    observer.observe(canvas)
    resize()
    start()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionQuery?.addEventListener('change', handleMotionChange)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionQuery?.removeEventListener('change', handleMotionChange)
      drawFrameRef.current = () => {}
    }
  }, [])

  useEffect(() => {
    colorRef.current = readParticleColor()
    drawFrameRef.current()
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 size-full"
    />
  )
}
