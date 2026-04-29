import { useEffect, useRef, useState } from 'react'
import { initAgent } from 'clippyjs'
import * as agents from 'clippyjs/agents'

const LINES: string[] = [
  'Skill issue',
  'I need a weapon',
  'bruh',
  'unlucky',
  'touch grass',
  'camping',
]

const AGENT_BUNDLES = {
  Bonzi: agents.Bonzi,
  Clippy: agents.Clippy,
  F1: agents.F1,
  Genie: agents.Genie,
  Genius: agents.Genius,
  Links: agents.Links,
  Merlin: agents.Merlin,
  Peedy: agents.Peedy,
  Rocky: agents.Rocky,
  Rover: agents.Rover,
}

type AgentName = keyof typeof AGENT_BUNDLES
const AGENT_NAMES = Object.keys(AGENT_BUNDLES) as AgentName[]

const STORAGE_KEY = 'clippy.agent'
const DEFAULT_AGENT: AgentName = 'Clippy'

type AgentInstance = Awaited<ReturnType<typeof initAgent>>

function loadInitialAgent(): AgentName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in AGENT_BUNDLES) return saved as AgentName
  } catch {
    // ignore
  }
  return DEFAULT_AGENT
}

export function ClippyComponent() {
  const [agentName, setAgentName] = useState<AgentName>(loadInitialAgent)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const agentRef = useRef<AgentInstance | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, agentName)
    } catch {
      // ignore
    }
  }, [agentName])

  useEffect(() => {
    let cancelled = false
    let intervalId: number | undefined
    let agentEl: HTMLElement | undefined
    let clickHandler: ((e: MouseEvent) => void) | undefined
    let ctxHandler: ((e: MouseEvent) => void) | undefined
    let mouseDownCapture: ((e: MouseEvent) => void) | undefined

    const sayRandom = (agent: AgentInstance) => {
      const line = LINES[Math.floor(Math.random() * LINES.length)]
      agent.speak(line, false)
    }

    initAgent(AGENT_BUNDLES[agentName])
      .then((agent) => {
        if (cancelled) {
          agent.dispose()
          return
        }
        agentRef.current = agent
        agent.show(false)

        agentEl = (agent as unknown as { _el?: HTMLElement })._el
        if (agentEl) {
          mouseDownCapture = (e: MouseEvent) => {
            if (e.button === 2) e.stopPropagation()
          }
          clickHandler = (e: MouseEvent) => {
            if (e.button !== 0) return
            agent.stop()
            if (Math.random() < 0.5) sayRandom(agent)
            else agent.animate()
          }
          ctxHandler = (e: MouseEvent) => {
            e.preventDefault()
            setMenu({ x: e.clientX, y: e.clientY })
          }
          agentEl.addEventListener('mousedown', mouseDownCapture, true)
          agentEl.addEventListener('click', clickHandler)
          agentEl.addEventListener('contextmenu', ctxHandler)
          agentEl.style.cursor = 'pointer'
        }

        intervalId = window.setInterval(
          () => sayRandom(agent),
          60000 + Math.floor(Math.random() * 60000),
        )
      })
      .catch((err) => {
        console.error('Clippy load failed', err)
      })

    return () => {
      cancelled = true
      if (intervalId !== undefined) window.clearInterval(intervalId)
      if (agentEl) {
        if (clickHandler) agentEl.removeEventListener('click', clickHandler)
        if (ctxHandler) agentEl.removeEventListener('contextmenu', ctxHandler)
        if (mouseDownCapture) agentEl.removeEventListener('mousedown', mouseDownCapture, true)
      }
      const a = agentRef.current
      if (a) {
        a.stop()
        a.dispose()
        agentRef.current = null
      }
    }
  }, [agentName])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  if (!menu) return null

  return (
    <ul
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        zIndex: 10002,
        background: 'silver',
        border: '2px outset #fff',
        padding: 2,
        margin: 0,
        listStyle: 'none',
        fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Arial, sans-serif",
        fontSize: 12,
        minWidth: 120,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
      }}
    >
      {AGENT_NAMES.map((n) => {
        const selected = n === agentName
        return (
          <li
            key={n}
            role="menuitem"
            onClick={() => {
              setAgentName(n)
              setMenu(null)
            }}
            style={{
              padding: '2px 16px',
              cursor: 'pointer',
              background: selected ? '#000080' : 'transparent',
              color: selected ? '#fff' : '#000',
            }}
          >
            {n}
          </li>
        )
      })}
    </ul>
  )
}
