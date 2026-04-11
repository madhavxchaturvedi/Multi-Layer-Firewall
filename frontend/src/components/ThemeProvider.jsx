// components/ThemeProvider.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('waf-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('waf-theme', theme)

    // Swap CSS custom properties dynamically
    const root = document.documentElement
    if (theme === 'light') {
      root.style.setProperty('--bg-base',    '#f0f2f5')
      root.style.setProperty('--bg-1',       '#ffffff')
      root.style.setProperty('--bg-2',       '#f5f6fa')
      root.style.setProperty('--bg-3',       '#eaecf0')
      root.style.setProperty('--text-pri',   '#0f1117')
      root.style.setProperty('--text-sec',   '#4b5563')
      root.style.setProperty('--text-muted', '#9ca3af')
      root.style.setProperty('--border-col', 'rgba(0,0,0,0.08)')
      document.body.style.background = '#f0f2f5'
      document.body.style.color = '#0f1117'
    } else {
      root.style.setProperty('--bg-base',    '#0d0f14')
      root.style.setProperty('--bg-1',       '#13161e')
      root.style.setProperty('--bg-2',       '#1a1e28')
      root.style.setProperty('--bg-3',       '#222736')
      root.style.setProperty('--text-pri',   '#e5e7eb')
      root.style.setProperty('--text-sec',   '#9ca3af')
      root.style.setProperty('--text-muted', '#4b5563')
      root.style.setProperty('--border-col', 'rgba(255,255,255,0.06)')
      document.body.style.background = '#0d0f14'
      document.body.style.color = '#e5e7eb'
    }
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
