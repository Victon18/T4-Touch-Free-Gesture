"use client"
import { useEffect, useRef, useState, useCallback } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
type DeviceName = "light" | "fan" | "tv" | "ac" | "speaker"

interface BaseDevice { status: "ON" | "OFF"; type: DeviceName; label: string; icon: string }
interface LightDevice    extends BaseDevice { type: "light";   brightness: number }
interface FanDevice      extends BaseDevice { type: "fan";     speed: number }
interface TvDevice       extends BaseDevice { type: "tv";      channel: number; volume: number }
interface AcDevice       extends BaseDevice { type: "ac";      temperature: number; mode: string }
interface SpeakerDevice  extends BaseDevice { type: "speaker"; volume: number; track: number }
type Device = LightDevice | FanDevice | TvDevice | AcDevice | SpeakerDevice
interface DevicesState { light: LightDevice; fan: FanDevice; tv: TvDevice; ac: AcDevice; speaker: SpeakerDevice }

const API            = "http://localhost:8000"
const COOLDOWN_MS    = 450
const POLL_GESTURE   = 180
const POLL_DEVICES   = 1200

// ── Gesture mapping ───────────────────────────────────────────────────────────
type GestureKey =
  | "THUMBS_UP" | "THUMBS_DOWN" | "PINCH" | "OPEN_PALM"
  | "PEACE" | "POINTING" | "ROCK" | "OK" | "THREE" | "CALL_ME"
  | "FOUR" | "FIST" | "NONE"

function gestureKey(raw: string): GestureKey {
  const s = raw.toLowerCase()
  if (s.includes("thumbs up"))     return "THUMBS_UP"
  if (s.includes("thumbs down"))   return "THUMBS_DOWN"
  if (s.includes("pinch"))         return "PINCH"
  if (s.includes("open palm"))     return "OPEN_PALM"
  if (s.includes("peace"))         return "PEACE"
  if (s.includes("pointing"))      return "POINTING"
  if (s.includes("rock"))          return "ROCK"
  if (s.includes("ok"))            return "OK"
  if (s.includes("three"))         return "THREE"
  if (s.includes("call me"))       return "CALL_ME"
  if (s.includes("four"))          return "FOUR"
  if (s.includes("fist"))          return "FIST"
  return "NONE"
}

const DEVICE_ORDER: DeviceName[] = ["light", "fan", "tv", "ac", "speaker"]

const GESTURE_META: Record<GestureKey, { emoji: string; label: string; action: string }> = {
  THUMBS_UP:   { emoji: "👍", label: "Thumbs Up",     action: "Turn ON active device" },
  THUMBS_DOWN: { emoji: "👎", label: "Thumbs Down",   action: "Turn OFF active device" },
  PINCH:       { emoji: "🤌", label: "Pinch",          action: "Increase value (brightness/speed/vol/temp)" },
  OPEN_PALM:   { emoji: "🖐", label: "Open Palm",      action: "Turn OFF ALL devices" },
  PEACE:       { emoji: "✌️", label: "Peace",           action: "Cycle to next device" },
  POINTING:    { emoji: "☝️", label: "Pointing",        action: "Cycle to previous device" },
  ROCK:        { emoji: "🤘", label: "Rock",            action: "Next track / channel +" },
  OK:          { emoji: "👌", label: "OK",              action: "Decrease value (brightness/speed/vol/temp)" },
  THREE:       { emoji: "🤟", label: "Three Fingers",  action: "Volume / speed step up" },
  CALL_ME:     { emoji: "🤙", label: "Call Me",        action: "Mute / mode switch" },
  FOUR:        { emoji: "🖖", label: "Four Fingers",   action: "Toggle Speaker" },
  FIST:        { emoji: "✊", label: "Fist",            action: "Confirm / hold" },
  NONE:        { emoji: "✋", label: "No Gesture",     action: "—" },
}

// ── Confidence ring ───────────────────────────────────────────────────────────
function ConfRing({ conf }: { conf: number }) {
  const r = 18, stroke = 4
  const circ = 2 * Math.PI * r
  const fill = circ * conf
  const color = conf > 0.75 ? "#4ade80" : conf > 0.5 ? "#facc15" : "#f87171"
  return (
    <svg width={44} height={44} style={{ flexShrink: 0 }}>
      <circle cx={22} cy={22} r={r} fill="none" stroke="#1e1e35" strokeWidth={stroke} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dasharray 0.3s ease, stroke 0.3s ease" }}
      />
      <text x={22} y={26} textAnchor="middle" fontSize={10} fill={color} fontWeight={700}>
        {Math.round(conf * 100)}%
      </text>
    </svg>
  )
}

// ── Device Card ───────────────────────────────────────────────────────────────
function DeviceCard({ name, dev, isActive, onToggle, onAction, onSelect }: {
  name: DeviceName
  dev: Device
  isActive: boolean
  onToggle: () => void
  onAction: (action: string, value?: number, svalue?: string) => void
  onSelect: () => void
}) {
  const isOn = dev.status === "ON"

  // Derive primary value & max for the progress bar
  let primaryVal = 0, primaryMax = 100, primaryLabel = ""
  if (dev.type === "light") {
    primaryVal = dev.brightness; primaryMax = 100; primaryLabel = `${dev.brightness}%`
  } else if (dev.type === "fan") {
    primaryVal = dev.speed; primaryMax = 5; primaryLabel = `Speed ${dev.speed}`
  } else if (dev.type === "tv") {
    primaryVal = dev.volume; primaryMax = 100; primaryLabel = `Vol ${dev.volume}%  •  Ch ${dev.channel}`
  } else if (dev.type === "ac") {
    primaryVal = dev.temperature - 16; primaryMax = 14; primaryLabel = `${dev.temperature}°C  •  ${dev.mode}`
  } else if (dev.type === "speaker") {
    primaryVal = dev.volume; primaryMax = 100; primaryLabel = `Vol ${dev.volume}%  •  Track ${dev.track}`
  }
  const pct = (primaryVal / primaryMax) * 100

  const barColor = isOn
    ? name === "light"   ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
    : name === "fan"     ? "linear-gradient(90deg,#0ea5e9,#38bdf8)"
    : name === "tv"      ? "linear-gradient(90deg,#ea580c,#fb923c)"
    : name === "ac"      ? "linear-gradient(90deg,#0891b2,#67e8f9)"
    :                      "linear-gradient(90deg,#16a34a,#4ade80)"
    : "#2e2e4e"

  return (
    <div onClick={onSelect} style={{
      ...s.card,
      ...(isActive ? s.cardActive : {}),
      borderColor: isOn ? (isActive ? "#a78bfa" : "#4ade80") : (isActive ? "#7c3aed" : "#1e1e35"),
      cursor: "pointer",
    }}>
      {isActive && <div style={s.activeBadge}>ACTIVE</div>}

      <div style={s.cardHeader}>
        <span style={{ fontSize: 34 }}>{dev.icon}</span>
        <div>
          <div style={s.deviceName}>{dev.label}</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{name}</div>
        </div>
      </div>

      <div style={{
        ...s.statusPill,
        background: isOn ? "#052e1666" : "#1e1e35",
        border: `1px solid ${isOn ? "#4ade80" : "#2e2e4e"}`,
        color: isOn ? "#4ade80" : "#555",
      }}>
        {isOn ? "● ON" : "○ OFF"}
      </div>

      {/* Progress bar */}
      <div style={s.barWrap}>
        <div style={s.barLabel}>{primaryLabel}</div>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      {/* Per-device quick controls */}
      {isOn && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {dev.type === "fan" && [1,2,3,4,5].map(n => (
            <div key={n} onClick={e => { e.stopPropagation(); onAction("set_speed", n) }}
              style={{ ...s.dot, background: n <= dev.speed ? "#38bdf8" : "#1e1e35", border: `1px solid ${n <= dev.speed ? "#38bdf8" : "#2e2e4e"}` }} />
          ))}
          {dev.type === "light" && [25,50,75,100].map(n => (
            <button key={n} onClick={e => { e.stopPropagation(); onAction("set_brightness", n) }}
              style={s.quickBtn}>{n}%</button>
          ))}
          {dev.type === "tv" && (
            <>
              <button onClick={e => { e.stopPropagation(); onAction("set_channel", dev.channel - 1) }} style={s.quickBtn}>CH-</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_channel", dev.channel + 1) }} style={s.quickBtn}>CH+</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_volume", dev.volume - 10) }} style={s.quickBtn}>Vol-</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_volume", dev.volume + 10) }} style={s.quickBtn}>Vol+</button>
            </>
          )}
          {dev.type === "ac" && (
            <>
              <button onClick={e => { e.stopPropagation(); onAction("set_temperature", dev.temperature - 1) }} style={s.quickBtn}>🌡-</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_temperature", dev.temperature + 1) }} style={s.quickBtn}>🌡+</button>
              {(["cool","heat","auto","dry","fan"] as const).map(m => (
                <button key={m} onClick={e => { e.stopPropagation(); onAction("set_mode", undefined, m) }}
                  style={{ ...s.quickBtn, background: dev.mode === m ? "#1a4060" : undefined }}>{m}</button>
              ))}
            </>
          )}
          {dev.type === "speaker" && (
            <>
              <button onClick={e => { e.stopPropagation(); onAction("prev_track") }} style={s.quickBtn}>⏮</button>
              <button onClick={e => { e.stopPropagation(); onAction("next_track") }} style={s.quickBtn}>⏭</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_volume", dev.volume - 10) }} style={s.quickBtn}>🔉</button>
              <button onClick={e => { e.stopPropagation(); onAction("set_volume", dev.volume + 10) }} style={s.quickBtn}>🔊</button>
            </>
          )}
        </div>
      )}

      <button onClick={e => { e.stopPropagation(); onToggle() }}
        style={{ ...s.btn, ...(isOn ? s.btnOn : s.btnOff) }}>
        {isOn ? "Turn OFF" : "Turn ON"}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ControlPage() {
  const [devices, setDevices]       = useState<DevicesState | null>(null)
  const [activeIdx, setActiveIdx]   = useState(0)
  const [connected, setConnected]   = useState(true)
  const [rawGesture, setRawGesture] = useState("None")
  const [confidence, setConf]       = useState(0)
  const [gesture, setGesture]       = useState<GestureKey>("NONE")
  const [lastAction, setLastAction] = useState("")
  const [actionLog, setActionLog]   = useState<string[]>([])

  const activeDevice = DEVICE_ORDER[activeIdx]
  const lastGstRef   = useRef<GestureKey>("NONE")
  const lastActTime  = useRef(0)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/devices`)
      const data = await res.json() as DevicesState
      setDevices(data); setConnected(true)
    } catch { setConnected(false) }
  }, [])

  const post = useCallback(async (device: DeviceName, action: string, value?: number, svalue?: string) => {
    try {
      await fetch(`${API}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device, action, value, svalue }),
      })
      await fetchDevices()
    } catch { /* ignore */ }
  }, [fetchDevices])

  const allOff = useCallback(async () => {
    try { await fetch(`${API}/all_off`, { method: "POST" }); await fetchDevices() }
    catch { /* ignore */ }
  }, [fetchDevices])

  const handleToggle = (d: DeviceName)                             => post(d, "toggle")
  const handleAction = (d: DeviceName, a: string, v?: number, sv?: string) => post(d, a, v, sv)

  // ── Gesture polling ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/gesture`)
        const data = await res.json() as { gesture: string; confidence: number }
        setRawGesture(data.gesture)
        setConf(data.confidence)
        const key = gestureKey(data.gesture)
        setGesture(key)

        if (key === "NONE") { lastGstRef.current = "NONE"; return }

        const now = Date.now()
        const cooldownOk = now - lastActTime.current > COOLDOWN_MS
        if (key === lastGstRef.current && !cooldownOk) return
        // Non-repeating gestures (fire once per hold)
        if (!["PINCH", "OK", "ROCK", "THREE"].includes(key) && key === lastGstRef.current) return

        lastGstRef.current = key
        lastActTime.current = now

        setDevices(prev => {
          if (!prev) return prev
          const dev = activeDevice as DeviceName
          const devState = prev[dev]
          let logMsg = ""


          switch (key) {
            case "THUMBS_UP":
              if (devState.status === "OFF") {
                logMsg = `👍 Turn ON ${dev}`
                post(dev, "toggle")
              }
              break

            case "THUMBS_DOWN":
              if (devState.status === "ON") {
                logMsg = `👎 Turn OFF ${dev}`
                post(dev, "toggle")
              }
              break

            case "OPEN_PALM":
              logMsg = "🖐 All devices OFF"
              allOff()
              break

            case "PEACE": {
              // Cycle to next device
              const nextIdx = (activeIdx + 1) % DEVICE_ORDER.length
              setActiveIdx(nextIdx)
              logMsg = `✌️ → ${DEVICE_ORDER[nextIdx] as DeviceName}`
              break
            }

            case "POINTING": {
              const prevIdx = (activeIdx - 1 + DEVICE_ORDER.length) % DEVICE_ORDER.length
              setActiveIdx(prevIdx)
              logMsg = `☝️ → ${DEVICE_ORDER[prevIdx] as DeviceName}`
              break
            }

            case "FOUR":
              // Toggle speaker
              logMsg = `🖖 Toggle speaker`
              post("speaker", "toggle")
              break

            case "PINCH": {
              // Step primary value UP
              if (dev === "light") {
                const cur = (devState as LightDevice).brightness
                const next = cur >= 100 ? 10 : Math.min(100, cur + 10)
                logMsg = `🤌 Brightness → ${next}%`
                post(dev, "set_brightness", next)
              } else if (dev === "fan") {
                const cur = (devState as FanDevice).speed
                const next = cur >= 5 ? 1 : cur + 1
                logMsg = `🤌 Fan speed → ${next}`
                post(dev, "set_speed", next)
              } else if (dev === "tv") {
                const cur = (devState as TvDevice).volume
                const next = Math.min(100, cur + 10)
                logMsg = `🤌 TV Vol → ${next}`
                post(dev, "set_volume", next)
              } else if (dev === "ac") {
                const cur = (devState as AcDevice).temperature
                const next = Math.min(30, cur + 1)
                logMsg = `🤌 AC Temp → ${next}°C`
                post(dev, "set_temperature", next)
              } else if (dev === "speaker") {
                const cur = (devState as SpeakerDevice).volume
                const next = Math.min(100, cur + 10)
                logMsg = `🤌 Speaker Vol → ${next}`
                post(dev, "set_volume", next)
              }
              break
            }

            case "OK": {
              // Step primary value DOWN
              if (dev === "light") {
                const cur = (devState as LightDevice).brightness
                const next = Math.max(1, cur - 10)
                logMsg = `👌 Brightness → ${next}%`
                post(dev, "set_brightness", next)
              } else if (dev === "fan") {
                const cur = (devState as FanDevice).speed
                const next = cur <= 1 ? 5 : cur - 1
                logMsg = `👌 Fan speed → ${next}`
                post(dev, "set_speed", next)
              } else if (dev === "tv") {
                const cur = (devState as TvDevice).volume
                const next = Math.max(0, cur - 10)
                logMsg = `👌 TV Vol → ${next}`
                post(dev, "set_volume", next)
              } else if (dev === "ac") {
                const cur = (devState as AcDevice).temperature
                const next = Math.max(16, cur - 1)
                logMsg = `👌 AC Temp → ${next}°C`
                post(dev, "set_temperature", next)
              } else if (dev === "speaker") {
                const cur = (devState as SpeakerDevice).volume
                const next = Math.max(0, cur - 10)
                logMsg = `👌 Speaker Vol → ${next}`
                post(dev, "set_volume", next)
              }
              break
            }

            case "ROCK":
              if (dev === "tv") {
                logMsg = `🤘 TV CH+`
                post(dev, "set_channel", (devState as TvDevice).channel + 1)
              } else if (dev === "speaker") {
                logMsg = `🤘 Next track`
                post(dev, "next_track")
              }
              break

            case "CALL_ME":
              if (dev === "speaker") {
                logMsg = `🤙 Prev track`
                post(dev, "prev_track")
              } else if (dev === "tv") {
                logMsg = `🤙 TV CH-`
                post(dev, "set_channel", Math.max(1, (devState as TvDevice).channel - 1))
              }
              break

            case "THREE":
              if (dev === "fan") {
                const cur = (devState as FanDevice).speed
                const next = Math.min(5, cur + 1)
                logMsg = `🤟 Fan speed → ${next}`
                post(dev, "set_speed", next)
              } else if (dev === "speaker") {
                const cur = (devState as SpeakerDevice).volume
                const next = Math.min(100, cur + 5)
                logMsg = `🤟 Speaker Vol → ${next}`
                post(dev, "set_volume", next)
              }
              break
          }

          if (logMsg) {
            setLastAction(logMsg)
            setActionLog(log => [logMsg, ...log].slice(0, 8))
          }
          return prev
        })
      } catch { setConnected(false) }
    }, POLL_GESTURE)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDevice, activeIdx, post, allOff])

  useEffect(() => {
    fetchDevices()
    const id = setInterval(fetchDevices, POLL_DEVICES)
    return () => clearInterval(id)
  }, [fetchDevices])

  if (!devices) return <div style={s.loading}>Connecting to backend…</div>

  const gMeta = GESTURE_META[gesture] ?? GESTURE_META["NONE"]

  return (
    <main style={s.root}>
      {/* ── Header ── */}
      <header style={s.header}>
        <span style={s.logo}>🖐 GestureControl</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ConfRing conf={confidence} />
          <span style={s.gestureChip}>{gMeta.emoji} {gMeta.label}</span>
          <span style={{
            ...s.badge,
            background: connected ? "#00ff9520" : "#ff444420",
            border: `1px solid ${connected ? "#00ff95" : "#ff4444"}`,
            color:  connected ? "#00ff95" : "#ff4444",
          }}>
            {connected ? "● Live" : "● Disconnected"}
          </span>
        </div>
      </header>

      <div style={s.body}>
        {/* ── Left: video + gesture info ── */}
        <div style={s.leftCol}>
          <div style={s.videoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${API}/video_feed`} alt="Live camera" style={s.video} />
            <div style={s.videoLabel}>📷 Camera Feed</div>
          </div>

          {/* Active gesture action hint */}
          <div style={s.actionHint}>
            <div style={{ fontSize: 28 }}>{gMeta.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, color: "#e0e0f0", fontSize: 14 }}>{gMeta.label}</div>
              <div style={{ color: "#888", fontSize: 12 }}>{gMeta.action}</div>
            </div>
          </div>

          {/* Action log */}
          {actionLog.length > 0 && (
            <div style={s.logPanel}>
              <div style={s.guideTitle}>Recent Actions</div>
              {actionLog.map((a, i) => (
                <div key={i} style={{ color: i === 0 ? "#c4b5fd" : "#555", fontSize: 12, padding: "2px 0" }}>{a}</div>
              ))}
            </div>
          )}

          {/* Gesture guide */}
          <div style={s.guide}>
            <div style={s.guideTitle}>Gesture Guide</div>
            {(Object.entries(GESTURE_META) as [GestureKey, typeof GESTURE_META[GestureKey]][])
              .filter(([k]) => k !== "NONE")
              .map(([k, { emoji, label, action }]) => (
              <div key={k} style={{
                ...s.guideRow,
                background: gesture === k ? "#1a0f3a" : "transparent",
                borderRadius: 8,
                padding: "4px 6px",
              }}>
                <span style={{ fontSize: 18, minWidth: 26 }}>{emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, color: gesture === k ? "#c4b5fd" : "#bbb", fontSize: 12 }}>{label}</div>
                  <div style={{ color: "#555", fontSize: 11 }}>{action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: device cards ── */}
        <div style={s.rightCol}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={s.sectionTitle}>Devices</div>
            <button onClick={() => allOff()} style={s.allOffBtn}>🖐 All Off</button>
          </div>

          <div style={s.cards}>
            {DEVICE_ORDER.map(name => (
              <DeviceCard
                key={name}
                name={name}
                dev={devices[name]}
                isActive={activeDevice === name}
                onToggle={() => handleToggle(name)}
                onAction={(a, v, sv) => handleAction(name, a, v, sv)}
                onSelect={() => setActiveIdx(DEVICE_ORDER.indexOf(name))}
              />
            ))}
          </div>

          <div style={s.activeHint}>
            <span style={{ color: "#444", fontSize: 11 }}>
              Active: <span style={{ color: "#7c3aed" }}>{activeDevice}</span>
              {" · "}Use ✌️/☝️ gestures or tap a card to switch
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 20% 0%, #0f0c1d 0%, #070710 60%)",
    color: "#e0e0f0",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  loading: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100vh", color: "#555", fontFamily: "'Inter', sans-serif", fontSize: 18, background: "#070710",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 28px", borderBottom: "1px solid #1a1a2e",
    background: "#0a0917", backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 10,
  },
  logo: { fontSize: 17, fontWeight: 700, color: "#c4b5fd", letterSpacing: "-0.3px" },
  gestureChip: {
    background: "#1a1040", border: "1px solid #4c3a8a", color: "#c4b5fd",
    padding: "5px 14px", borderRadius: 30, fontSize: 13, fontWeight: 600,
  },
  badge: { fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, letterSpacing: "0.3px" },
  body: { display: "flex", gap: 22, padding: "22px 28px", flex: 1, flexWrap: "wrap", alignItems: "flex-start" },
  leftCol: { flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 14 },
  videoWrap: {
    position: "relative", borderRadius: 14, overflow: "hidden",
    border: "1px solid #1e1e35", background: "#000", aspectRatio: "4/3",
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  videoLabel: {
    position: "absolute", bottom: 8, left: 10, fontSize: 11, color: "#666",
    background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 10,
  },
  actionHint: {
    background: "#0e0e1e", border: "1px solid #1e1e35", borderRadius: 12,
    padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
  },
  logPanel: {
    background: "#0a0a18", border: "1px solid #1a1a2e", borderRadius: 10,
    padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2,
  },
  guide: {
    background: "#0e0e1e", border: "1px solid #1e1e35", borderRadius: 12,
    padding: "14px", display: "flex", flexDirection: "column", gap: 6,
    maxHeight: 340, overflowY: "auto",
  },
  guideTitle: {
    fontSize: 10, fontWeight: 700, color: "#444",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
  },
  guideRow: { display: "flex", alignItems: "flex-start", gap: 10, transition: "background 0.2s" },
  rightCol: { flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 },
  card: {
    position: "relative", background: "#0c0c1f", borderRadius: 18, border: "1px solid #1e1e35",
    padding: "22px 18px 18px", display: "flex", flexDirection: "column", gap: 12,
    transition: "all 0.25s ease", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  cardActive: { background: "#100c22", boxShadow: "0 0 0 1px #7c3aed, 0 8px 32px rgba(124,58,237,0.2)" },
  activeBadge: {
    position: "absolute", top: 12, right: 14, fontSize: 9, fontWeight: 700,
    color: "#a78bfa", background: "#1e0f45", border: "1px solid #4c3a8a",
    padding: "2px 8px", borderRadius: 10, letterSpacing: 1,
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 12 },
  deviceName: { fontSize: 18, fontWeight: 700, color: "#e0e0f0" },
  statusPill: {
    display: "inline-flex", alignItems: "center", padding: "5px 14px",
    borderRadius: 30, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", alignSelf: "flex-start",
  },
  barWrap: { display: "flex", flexDirection: "column", gap: 6 },
  barLabel: { fontSize: 12, color: "#666", fontWeight: 600 },
  barTrack: { height: 5, background: "#1a1a2e", borderRadius: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 10, transition: "width 0.4s ease, background 0.4s ease" },
  dot: { width: 22, height: 22, borderRadius: "50%", cursor: "pointer", transition: "all 0.2s ease" },
  quickBtn: {
    background: "#111126", border: "1px solid #2a2a4a", color: "#888",
    fontSize: 11, padding: "4px 9px", borderRadius: 7, cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.15s",
  },
  btn: {
    border: "none", borderRadius: 10, padding: "10px 0",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
    transition: "all 0.2s ease", marginTop: 2, fontFamily: "inherit",
  },
  btnOn:  { background: "#1c0f3a", color: "#c4b5fd", border: "1px solid #4c3a8a" },
  btnOff: { background: "#0f2a1c", color: "#4ade80", border: "1px solid #166534" },
  allOffBtn: {
    background: "#200a0a", border: "1px solid #4a1515", color: "#f87171",
    fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
    cursor: "pointer", fontFamily: "inherit",
  },
  activeHint: { padding: "4px 0" },
}
