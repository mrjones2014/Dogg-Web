import { useEffect, useRef, useState } from 'react'

interface Props {
  src?: string
  size?: number
}

export function RetroCursor({ src = '/cursors/cursor.gif', size = 32 }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (failed) return

    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-retro-cursor', 'true')
    styleEl.textContent = `*, *::before, *::after { cursor: none !important; }`
    document.head.appendChild(styleEl)

    let rafId = 0
    let lastX = -100
    let lastY = -100

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const el = imgRef.current
        if (el) el.style.transform = `translate(${lastX}px, ${lastY}px)`
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId) cancelAnimationFrame(rafId)
      styleEl.remove()
    }
  }, [failed])

  if (failed) return null

  return (
    <img
      ref={imgRef}
      src={src}
      alt=""
      onError={() => setFailed(true)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 99999,
        imageRendering: 'pixelated',
        transform: 'translate(-100px, -100px)',
      }}
    />
  )
}
