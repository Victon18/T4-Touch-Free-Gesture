"use client"
import { useEffect, useState, useRef } from "react"

const GESTURES_LIST = [
  { emoji: "🖐", label: "Open Palm" },
  { emoji: "✌️", label: "Peace" },
  { emoji: "☝️", label: "Pointing" },
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "👎", label: "Thumbs Down" },
  { emoji: "🤘", label: "Rock" },
  { emoji: "✊", label: "Fist" },
  { emoji: "🤌", label: "Pinch" },
]

export default function ModelPage() {
  const [gesture, setGesture]     = useState("...")
  const [connected, setConnected] = useState(true)
  const [fps, setFps]             = useState(0)
  const frameCount = useRef(0)
  const lastTick   = useRef(Date.now())

  /* Gesture polling */
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch("http://localhost:8000/gesture")
        const data = await res.json()
        setGesture(data.gesture)
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }, 200)
    return () => clearInterval(id)
  }, [])

  /* FPS counter via load events on the img */
  const handleImgLoad = () => {
    frameCount.current++
    const now  = Date.now()
    const diff = now - lastTick.current
    if (diff >= 1000) {
      setFps(Math.round((frameCount.current * 1000) / diff))
      frameCount.current = 0
      lastTick.current   = now
    }
  }

  /* derive label without emoji for matching */
  const gestureName = gesture.replace(/[^\w\s]/gu, "").trim()

  return (
    <main style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>👁 GestureAI</span>
        <span style={{
          ...styles.badge,
          background: connected ? "#00ff9533" : "#ff444433",
          border: `1px solid ${connected ? "#00ff95" : "#ff4444"}`,
          color:  connected ? "#00ff95" : "#ff4444",
        }}>
          {connected ? "● Live" : "● Disconnected"}
        </span>
      </div>

      <div style={styles.body}>
        {/* Video panel */}
        <div style={styles.videoCard}>
          <div style={styles.videoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="http://localhost:8000/video_feed"
              alt="Live camera feed"
              style={styles.video}
              onLoad={handleImgLoad}
            />
            {/* Overlay: gesture pill */}
            <div style={styles.overlay}>
              <span style={styles.gesturePill}>{gesture}</span>
              <span style={styles.fpsBadge}>{fps} fps</span>
            </div>
          </div>
          <p style={styles.hint}>Hand landmarks are drawn in real-time by the backend</p>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <h2 style={styles.sideTitle}>Supported Gestures</h2>
          <div style={styles.gestureGrid}>
            {GESTURES_LIST.map(({ emoji, label }) => {
              const active = gestureName.toLowerCase().includes(label.toLowerCase())
              return (
                <div
                  key={label}
                  style={{
                    ...styles.gestureCard,
                    ...(active ? styles.gestureCardActive : {}),
                  }}
                >
                  <span style={styles.gestureEmoji}>{emoji}</span>
                  <span style={styles.gestureLabel}>{label}</span>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </main>
  )
}

/* ── Inline styles ─────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e8f0",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 32px",
    borderBottom: "1px solid #1e1e2e",
    background: "#0d0d15",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: "#c9b8ff",
  },
  badge: {
    fontSize: 13,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    letterSpacing: "0.3px",
  },
  body: {
    display: "flex",
    gap: 28,
    padding: "28px 32px",
    flex: 1,
    flexWrap: "wrap",
  },
  videoCard: {
    flex: "1 1 560px",
    background: "#0d0d15",
    borderRadius: 16,
    border: "1px solid #1e1e2e",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  videoWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "4/3",
    background: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  overlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  gesturePill: {
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(180,130,255,0.35)",
    color: "#ddd0ff",
    fontSize: 20,
    fontWeight: 700,
    padding: "6px 18px",
    borderRadius: 40,
    letterSpacing: "0.2px",
  },
  fpsBadge: {
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    border: "1px solid #1e1e2e",
    color: "#888",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 20,
  },
  hint: {
    padding: "12px 18px",
    fontSize: 12,
    color: "#444",
    margin: 0,
    borderTop: "1px solid #1a1a26",
  },
  sidebar: {
    flex: "0 0 260px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sideTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#888",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  gestureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  gestureCard: {
    background: "#0d0d15",
    border: "1px solid #1e1e2e",
    borderRadius: 12,
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s ease",
  },
  gestureCardActive: {
    background: "#1a0f2e",
    border: "1px solid #7c4dff",
    boxShadow: "0 0 16px #7c4dff44",
  },
  gestureEmoji: {
    fontSize: 28,
  },
  gestureLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#888",
    textAlign: "center",
  },
}
