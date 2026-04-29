import { useState, useCallback } from 'react'
import 'react-rnd'
import '98.css'
import './App.css'
import { Window } from './components/Window'
import { Taskbar } from './components/Taskbar'
import { About } from './components/pages/About'
import { Events } from './components/pages/Events'
import { Clicker } from './components/pages/Clicker'
import { Leaderboard } from './components/pages/Leaderboard'
import { ClippyComponent } from './components/Clippy'
import { RetroCursor } from './components/RetroCursor'
import dogghouseLogo from './assets/logo.png'
import doggLogo from './assets/dog-logo.png'
import calendarIcon from './assets/calendar-icon.png'
import petSimulatorIcon from './assets/pet-simulator-icon.png'
import leaderboardIcon from './assets/leaderboard-logo.png';
import * as React from "react";

// Dog reference: https://models.spriters-resource.com/3ds/thelegendofzeldamajorasmask3d/asset/303265/

interface WindowConfig {
  id: string
  title: string
  label: string,
  defaultX: number
  defaultY: number

  defaultWidth: number
  defaultHeight: number
  content: React.ReactNode
  logo: string
}

const WINDOW_DEFS: Omit<WindowConfig, 'content'>[] = [
  {id: 'about', title: 'About', label: 'About', defaultX: 60, defaultY: 40, defaultWidth: 420, defaultHeight: 320, logo: dogghouseLogo},
  {id: 'events', title: 'Events', label: 'Events', defaultX: 160, defaultY: 100, defaultWidth: 400, defaultHeight: 340, logo: calendarIcon},
  {id: 'clicker', title: 'Dog Petter', label: 'Dog Petter', defaultX: 260, defaultY: 160, defaultWidth: 400, defaultHeight: 475, logo: petSimulatorIcon},
  {id: 'leaderboard', title: 'Leaderboard', label: 'Leaderboard', defaultX: 360, defaultY: 220, defaultWidth: 400, defaultHeight: 400, logo: leaderboardIcon},
]

const CONTENT_MAP: Record<string, React.ReactNode> = {
    about: <About/>,
    events: <Events/>,
    clicker: <Clicker/>,
    leaderboard: <Leaderboard/>,
}


export default function App() {
  const [openIds, setOpenIds] = useState<string[]>([])
  const [focusOrder, setFocusOrder] = useState<string[]>([])
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set())

  const openWindow = useCallback((id: string) => {
    setOpenIds(prev => prev.includes(id) ? prev : [...prev, id])
    setMinimizedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    setFocusOrder(prev => [...prev.filter(x => x !== id), id])
  }, [])

  const closeWindow = useCallback((id: string) => {
    setOpenIds(prev => prev.filter(x => x !== id))
    setMinimizedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    setFocusOrder(prev => prev.filter(x => x !== id))
  }, [])

  const focusWindow = useCallback((id: string) => {
    setFocusOrder(prev => [...prev.filter(x => x !== id), id])
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setMinimizedIds(prev => { const s = new Set(prev); s.add(id); return s })
  }, [])

  const openWindows = openIds.map(id => ({ id, title: WINDOW_DEFS.find(w => w.id === id)?.title ?? id }))

  return (
    <section className="desktop">
      <div className="desktop-icons">
        {WINDOW_DEFS.map(config => (
          <button
            key={config.id}
            className="desktop-icon"
            onDoubleClick={() => openWindow(config.id)}
          >
            <span className="desktop-icon-img">{(config.logo) ? <img width={64} height={64} src={config.logo} alt={config.label} /> : ""}</span>
            <span className="desktop-icon-label">{config.label}</span>
          </button>
        ))}
      </div>

      {openIds.map(id => {
        const def = WINDOW_DEFS.find(w => w.id === id)!
        const zIndex = 100 + focusOrder.indexOf(id)
        return (
          <Window
            key={id}
            id={id}
            title={def.title}
            icon={doggLogo}
            defaultX={def.defaultX}
            defaultY={def.defaultY}
            defaultWidth={def.defaultWidth}
            defaultHeight={def.defaultHeight}
            minimized={minimizedIds.has(id)}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMinimize={minimizeWindow}
            zIndex={zIndex}
          >
            {CONTENT_MAP[id]}
          </Window>
        )
      })}

      <Taskbar openWindows={openWindows} minimizedIds={minimizedIds} onOpenWindow={openWindow} />
      <ClippyComponent />
      <RetroCursor />
    </section>
  )
}
