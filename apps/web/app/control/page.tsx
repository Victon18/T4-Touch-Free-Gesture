"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { initGestureRecognizer, getGestureRecognizer, detectCustomGestures, detectDualHandGestures, detectBothHandsPresent } from "@/lib/gesture"

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

const COOLDOWN_MS    = 600

const INITIAL_DEVICES: DevicesState = {
  light: { status: "OFF", type: "light", label: "Living Room Light", icon: "💡", brightness: 50 },
  fan: { status: "OFF", type: "fan", label: "Ceiling Fan", icon: "🌪", speed: 3 },
  tv: { status: "OFF", type: "tv", label: "Smart TV", icon: "📺", channel: 5, volume: 20 },
  ac: { status: "OFF", type: "ac", label: "Air Conditioner", icon: "❄️", temperature: 24, mode: "cool" },
  speaker: { status: "OFF", type: "speaker", label: "Home Pod", icon: "🔊", volume: 40, track: 1 }
};

// ── Gesture mapping ───────────────────────────────────────────────────────────
type GestureKey =
  | "THUMBS_UP" | "THUMBS_DOWN" | "PINCH" | "OPEN_PALM"
  | "PEACE" | "POINTING" | "ROCK" | "OK" | "THREE" | "CALL_ME"
  | "FOUR" | "FIST" | "NONE"

function gestureKey(raw: string): GestureKey {
  const s = raw.toLowerCase()
  if (s.includes("thumbs up") || s.includes("thumb_up")) return "THUMBS_UP"
  if (s.includes("thumbs down") || s.includes("thumb_down")) return "THUMBS_DOWN"
  if (s.includes("pinch"))         return "PINCH"
  if (s.includes("open palm") || s.includes("open_palm")) return "OPEN_PALM"
  if (s.includes("peace") || s.includes("victory")) return "PEACE"
  if (s.includes("pointing") || s.includes("pointing_up")) return "POINTING"
  if (s.includes("rock") || s.includes("iloveyou")) return "ROCK"
  if (s.includes("ok"))            return "OK"
  if (s.includes("three"))         return "THREE"
  if (s.includes("call me") || s.includes("call_me")) return "CALL_ME"
  if (s.includes("four"))          return "FOUR"
  if (s.includes("fist") || s.includes("closed_fist")) return "FIST"
  return "NONE"
}

const DEVICE_ORDER: DeviceName[] = ["light", "fan", "tv", "ac", "speaker"]

// Gesture-to-device toggle mapping (direct control)
const GESTURE_TO_DEVICE: Record<GestureKey, DeviceName | undefined> = {
  THREE: "light",     // Three Fingers = Toggle Light
  FOUR: "fan",        // Four Fingers = Toggle Fan
  ROCK: "tv",         // Rock = Toggle TV
  PEACE: "ac",        // Peace = Toggle AC
  CALL_ME: "speaker", // Call Me = Toggle Speaker
  THUMBS_UP: undefined,
  THUMBS_DOWN: undefined,
  PINCH: undefined,
  OPEN_PALM: undefined,
  POINTING: undefined,
  OK: undefined,
  FIST: undefined,
  NONE: undefined,
}

const GESTURE_META: Record<GestureKey, { emoji: string; label: string; action: string }> = {
  THUMBS_UP:   { emoji: "👍", label: "Thumbs Up",     action: "Increase value" },
  THUMBS_DOWN: { emoji: "👎", label: "Thumbs Down",   action: "Decrease value" },
  PINCH:       { emoji: "🤌", label: "Pinch",          action: "Step up / next" },
  OPEN_PALM:   { emoji: "🖐", label: "Open Palm",      action: "Turn OFF ALL devices" },
  PEACE:       { emoji: "✌️", label: "Peace",           action: "Toggle AC" },
  POINTING:    { emoji: "☝️", label: "Pointing",        action: "Cycle device" },
  ROCK:        { emoji: "🤘", label: "Rock",            action: "Toggle TV" },
  OK:          { emoji: "👌", label: "OK",              action: "Step down / prev" },
  THREE:       { emoji: "🤟", label: "Three Fingers",  action: "Toggle Light" },
  CALL_ME:     { emoji: "🤙", label: "Call Me",        action: "Toggle Speaker" },
  FOUR:        { emoji: "🖖", label: "Four Fingers",   action: "Toggle Fan" },
  FIST:        { emoji: "✊", label: "Fist",            action: "Cycle device" },
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
  const [devices, setDevices]       = useState<DevicesState>(INITIAL_DEVICES)
  const [activeIdx, setActiveIdx]   = useState(0)
  const [connected, setConnected]   = useState(false)
  const [confidence, setConf]       = useState(0)
  const [gesture, setGesture]       = useState<GestureKey>("NONE")
  const [leftGesture, setLeftGesture] = useState<GestureKey>("NONE")
  const [rightGesture, setRightGesture] = useState<GestureKey>("NONE")
  const [leftConfidence, setLeftConf] = useState(0)
  const [rightConfidence, setRightConf] = useState(0)
  const [bothHandsDetected, setBothHandsDetected] = useState(false)
  const [actionLog, setActionLog]   = useState<string[]>([])
  const [camOn, setCamOn]           = useState(false)

  const activeDevice = DEVICE_ORDER[activeIdx]
  const lastGstRef   = useRef<GestureKey>("NONE")
  const lastActTime  = useRef(0)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const requestRef   = useRef<number>(0)
  const lastVideoTimeRef = useRef(-1)
  
  // Gesture stability tracking for improved accuracy - dual hand version
  const leftHandStabilityRef = useRef<{ gesture: GestureKey; count: number; confidence: number }>({ gesture: "NONE", count: 0, confidence: 0 })
  const rightHandStabilityRef = useRef<{ gesture: GestureKey; count: number; confidence: number }>({ gesture: "NONE", count: 0, confidence: 0 })
  const lastLeftActTimeRef = useRef(0)
  const lastRightActTimeRef = useRef(0)
  const STABILITY_THRESHOLD = 5 // Require gesture detected 5 frames in a row for dual-hand mode
  const CONFIDENCE_THRESHOLD = 0.7 // Require 70% confidence for dual-hand mode

  // ── Local Device Handlers ─────────────────────────────────────────────────
  const postLocal = useCallback((device: DeviceName, action: string, value?: number, svalue?: string) => {
    setDevices(prev => {
      const state = { ...prev }
      const dev = { ...state[device] } as any
      if (action === "toggle") dev.status = dev.status === "ON" ? "OFF" : "ON"
      if (action === "set_brightness") dev.brightness = value
      if (action === "set_speed") dev.speed = value
      if (action === "set_channel") dev.channel = value
      if (action === "set_volume") dev.volume = value
      if (action === "set_temperature") dev.temperature = value
      if (action === "set_mode") dev.mode = svalue
      if (action === "next_track") dev.track += 1
      if (action === "prev_track") dev.track = Math.max(1, dev.track - 1)
      state[device] = dev
      return state
    })
  }, [])

  const allOffLocal = useCallback(() => {
    setDevices(prev => {
      const state = { ...prev }
      for (const k of DEVICE_ORDER) {
        state[k] = { ...state[k], status: "OFF" } as any
      }
      return state
    })
  }, [])

  const handleToggle = (d: DeviceName)                             => postLocal(d, "toggle")
  const handleAction = (d: DeviceName, a: string, v?: number, sv?: string) => postLocal(d, a, v, sv)

  const handleGestureAction = useCallback((key: GestureKey) => {
    if (key === "NONE") { lastGstRef.current = "NONE"; return }

    const now = Date.now()
    const cooldownOk = now - lastActTime.current > COOLDOWN_MS
    if (key === lastGstRef.current && !cooldownOk) return
    // Non-repeating gestures (fire once per hold)
    if (!["PINCH", "OK", "THUMBS_UP", "THUMBS_DOWN"].includes(key) && key === lastGstRef.current) return

    lastGstRef.current = key
    lastActTime.current = now

    let logMsg = ""

    setDevices(prev => {
      const state = { ...prev }
      const devName = activeDevice as DeviceName
      const devState = { ...state[devName] } as any

      // Check if this gesture is a direct device toggle
      const deviceToToggle = GESTURE_TO_DEVICE[key]
      if (deviceToToggle) {
        const devToToggle = { ...state[deviceToToggle] } as any
        devToToggle.status = devToToggle.status === "ON" ? "OFF" : "ON"
        state[deviceToToggle] = devToToggle
        logMsg = `${GESTURE_META[key].emoji} Toggle ${deviceToToggle}: ${devToToggle.status}`
        return state
      }

      switch (key) {
        case "THUMBS_UP":
          devState.brightness = Math.min(100, devState.brightness + 10)
          logMsg = `👍 Brightness → ${devState.brightness}%`
          break

        case "THUMBS_DOWN":
          devState.brightness = Math.max(1, devState.brightness - 10)
          logMsg = `👎 Brightness → ${devState.brightness}%`
          break

        case "OPEN_PALM":
          logMsg = "🖐 All devices OFF"
          for (const k of DEVICE_ORDER) {
            state[k] = { ...state[k], status: "OFF" } as any
          }
          break

        case "POINTING": {
          const nextIdx = (activeIdx + 1) % DEVICE_ORDER.length
          setActiveIdx(nextIdx)
          logMsg = `☝️ → ${DEVICE_ORDER[nextIdx] as DeviceName}`
          break
        }

        case "PINCH": {
          if (devName === "light") {
            devState.brightness = devState.brightness >= 100 ? 10 : Math.min(100, devState.brightness + 10)
            logMsg = `🤌 Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = devState.speed >= 5 ? 1 : devState.speed + 1
            logMsg = `🤌 Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.volume = Math.min(100, devState.volume + 10)
            logMsg = `🤌 TV Vol → ${devState.volume}`
          } else if (devName === "ac") {
            devState.temperature = Math.min(30, devState.temperature + 1)
            logMsg = `🤌 AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.volume = Math.min(100, devState.volume + 10)
            logMsg = `🤌 Speaker Vol → ${devState.volume}`
          }
          break
        }

        case "OK": {
          if (devName === "light") {
            devState.brightness = Math.max(1, devState.brightness - 10)
            logMsg = `👌 Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = devState.speed <= 1 ? 5 : devState.speed - 1
            logMsg = `👌 Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.volume = Math.max(0, devState.volume - 10)
            logMsg = `👌 TV Vol → ${devState.volume}`
          } else if (devName === "ac") {
            devState.temperature = Math.max(16, devState.temperature - 1)
            logMsg = `👌 AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.volume = Math.max(0, devState.volume - 10)
            logMsg = `👌 Speaker Vol → ${devState.volume}`
          }
          break
        }

        case "FIST": {
          if (devName === "tv") {
            logMsg = `✊ TV CH+`
            devState.channel += 1
          } else if (devName === "speaker") {
            logMsg = `✊ Next track`
            devState.track += 1
          }
          break
        }

        default:
          return state
      }

      state[devName] = devState
      return state
    })

    if (logMsg) {
      setActionLog(prev => [...prev.slice(-9), logMsg])
    }
  }, [activeIdx])

  // ── Left Hand Handler: Device Selection ────────────────────────────────────
  const handleLeftHandGesture = useCallback((key: GestureKey) => {
    if (key === "NONE") {
      leftHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 }
      return
    }

    const now = Date.now()
    const cooldownOk = now - lastLeftActTimeRef.current > COOLDOWN_MS
    if (key === leftHandStabilityRef.current.gesture && !cooldownOk) return

    lastLeftActTimeRef.current = now

    let logMsg = ""

    // Left hand controls device selection
    switch (key) {
      case "THREE":
        setActiveIdx(DEVICE_ORDER.indexOf("light"))
        logMsg = `🖐 LEFT: Select Light`
        break
      case "FOUR":
        setActiveIdx(DEVICE_ORDER.indexOf("fan"))
        logMsg = `🖐 LEFT: Select Fan`
        break
      case "ROCK":
        setActiveIdx(DEVICE_ORDER.indexOf("tv"))
        logMsg = `🖐 LEFT: Select TV`
        break
      case "PEACE":
        setActiveIdx(DEVICE_ORDER.indexOf("ac"))
        logMsg = `🖐 LEFT: Select AC`
        break
      case "CALL_ME":
        setActiveIdx(DEVICE_ORDER.indexOf("speaker"))
        logMsg = `🖐 LEFT: Select Speaker`
        break
      case "OPEN_PALM":
        logMsg = "🖐 All devices OFF"
        setDevices(prev => {
          const state = { ...prev }
          for (const k of DEVICE_ORDER) {
            state[k] = { ...state[k], status: "OFF" } as any
          }
          return state
        })
        break
      default:
        return
    }

    if (logMsg) {
      setActionLog(prev => [...prev.slice(-9), logMsg])
    }
  }, [])

  // ── Right Hand Handler: Device Control ─────────────────────────────────────
  const handleRightHandGesture = useCallback((key: GestureKey) => {
    if (key === "NONE") {
      rightHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 }
      return
    }

    const now = Date.now()
    const cooldownOk = now - lastRightActTimeRef.current > COOLDOWN_MS
    if (key === rightHandStabilityRef.current.gesture && !cooldownOk) return
    // Non-repeating gestures (fire once per hold)
    if (!["PINCH", "OK", "THUMBS_UP", "THUMBS_DOWN"].includes(key) && key === rightHandStabilityRef.current.gesture) return

    rightHandStabilityRef.current.gesture = key
    lastRightActTimeRef.current = now

    let logMsg = ""

    setDevices(prev => {
      const state = { ...prev }
      const devName = activeDevice as DeviceName
      const devState = { ...state[devName] } as any

      switch (key) {
        case "THUMBS_UP":
          if (devName === "light") {
            devState.brightness = Math.min(100, devState.brightness + 10)
            logMsg = `👍 RIGHT: Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = Math.min(5, devState.speed + 1)
            logMsg = `👍 RIGHT: Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.volume = Math.min(100, devState.volume + 10)
            logMsg = `👍 RIGHT: TV Vol → ${devState.volume}%`
          } else if (devName === "ac") {
            devState.temperature = Math.min(30, devState.temperature + 1)
            logMsg = `👍 RIGHT: AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.volume = Math.min(100, devState.volume + 10)
            logMsg = `👍 RIGHT: Speaker Vol → ${devState.volume}%`
          }
          break

        case "THUMBS_DOWN":
          if (devName === "light") {
            devState.brightness = Math.max(1, devState.brightness - 10)
            logMsg = `👎 RIGHT: Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = Math.max(1, devState.speed - 1)
            logMsg = `👎 RIGHT: Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.volume = Math.max(0, devState.volume - 10)
            logMsg = `👎 RIGHT: TV Vol → ${devState.volume}%`
          } else if (devName === "ac") {
            devState.temperature = Math.max(16, devState.temperature - 1)
            logMsg = `👎 RIGHT: AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.volume = Math.max(0, devState.volume - 10)
            logMsg = `👎 RIGHT: Speaker Vol → ${devState.volume}%`
          }
          break

        case "PINCH":
          if (devName === "light") {
            devState.brightness = devState.brightness >= 100 ? 10 : Math.min(100, devState.brightness + 10)
            logMsg = `🤌 RIGHT: Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = devState.speed >= 5 ? 1 : devState.speed + 1
            logMsg = `🤌 RIGHT: Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.channel = devState.channel + 1
            logMsg = `🤌 RIGHT: TV CH → ${devState.channel}`
          } else if (devName === "ac") {
            devState.temperature = Math.min(30, devState.temperature + 1)
            logMsg = `🤌 RIGHT: AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.track = devState.track + 1
            logMsg = `🤌 RIGHT: Next track`
          }
          break

        case "OK":
          if (devName === "light") {
            devState.brightness = Math.max(1, devState.brightness - 10)
            logMsg = `👌 RIGHT: Brightness → ${devState.brightness}%`
          } else if (devName === "fan") {
            devState.speed = devState.speed <= 1 ? 5 : devState.speed - 1
            logMsg = `👌 RIGHT: Fan speed → ${devState.speed}`
          } else if (devName === "tv") {
            devState.channel = Math.max(1, devState.channel - 1)
            logMsg = `👌 RIGHT: TV CH → ${devState.channel}`
          } else if (devName === "ac") {
            devState.temperature = Math.max(16, devState.temperature - 1)
            logMsg = `👌 RIGHT: AC Temp → ${devState.temperature}°C`
          } else if (devName === "speaker") {
            devState.track = Math.max(1, devState.track - 1)
            logMsg = `👌 RIGHT: Prev track`
          }
          break

        default:
          return state
      }

      state[devName] = devState
      return state
    })

    if (logMsg) {
      setActionLog(prev => [...prev.slice(-9), logMsg])
    }
  }, [activeIdx])

  // ── Camera and Gesture Recognition (Dual Hand) ───────────────────────────
  useEffect(() => {
    let mounted = true;
    async function setupCamera() {
      try {
        await initGestureRecognizer();
        if (!mounted) return;
        setConnected(true);
      } catch (e) {
        console.error("GestureRecognizer init error:", e);
      }
    }
    setupCamera();

    return () => {
      mounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const recognizer = getGestureRecognizer();
    
    if (video && canvas && recognizer && video.readyState >= 2) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        const nowInMs = Date.now();
        const results = recognizer.recognizeForVideo(video, nowInMs);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (results.landmarks && results.landmarks.length > 0) {
            // Draw landmarks for both hands with different colors
            results.landmarks.forEach((landmarks, idx) => {
              ctx.fillStyle = idx === 0 ? "#a78bfa" : "#67e8f9"; // Purple for left, cyan for right
              for (const lm of landmarks) {
                ctx.beginPath();
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
              }
            });
          }
          ctx.restore();
        }

        // Detect dual-hand gestures
        const dualGestures = detectDualHandGestures(results);

        if (!dualGestures.bothHandsDetected) {
          // Both hands not detected, reset
          leftHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 };
          rightHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 };
          setLeftGesture("NONE");
          setRightGesture("NONE");
          setLeftConf(0);
          setRightConf(0);
          setBothHandsDetected(false);
          setGesture("NONE");
          setConf(0);
        } else {
          setBothHandsDetected(true);

          // Process left hand gesture (device selection)
          const leftGestureKey = dualGestures.leftGesture ? gestureKey(dualGestures.leftGesture) : "NONE";
          
          if (leftGestureKey === "NONE" || dualGestures.leftConfidence < CONFIDENCE_THRESHOLD) {
            leftHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 };
            setLeftGesture("NONE");
            setLeftConf(0);
          } else {
            if (leftGestureKey === leftHandStabilityRef.current.gesture) {
              leftHandStabilityRef.current.count += 1;
              leftHandStabilityRef.current.confidence = Math.max(leftHandStabilityRef.current.confidence, dualGestures.leftConfidence);
              
              if (leftHandStabilityRef.current.count >= STABILITY_THRESHOLD) {
                setLeftGesture(leftGestureKey);
                setLeftConf(leftHandStabilityRef.current.confidence);
                handleLeftHandGesture(leftGestureKey);
              }
            } else {
              leftHandStabilityRef.current = { gesture: leftGestureKey, count: 1, confidence: dualGestures.leftConfidence };
              setLeftGesture(leftGestureKey);
              setLeftConf(dualGestures.leftConfidence);
            }
          }

          // Process right hand gesture (device control)
          const rightGestureKey = dualGestures.rightGesture ? gestureKey(dualGestures.rightGesture) : "NONE";
          
          if (rightGestureKey === "NONE" || dualGestures.rightConfidence < CONFIDENCE_THRESHOLD) {
            rightHandStabilityRef.current = { gesture: "NONE", count: 0, confidence: 0 };
            setRightGesture("NONE");
            setRightConf(0);
          } else {
            if (rightGestureKey === rightHandStabilityRef.current.gesture) {
              rightHandStabilityRef.current.count += 1;
              rightHandStabilityRef.current.confidence = Math.max(rightHandStabilityRef.current.confidence, dualGestures.rightConfidence);
              
              if (rightHandStabilityRef.current.count >= STABILITY_THRESHOLD) {
                setRightGesture(rightGestureKey);
                setRightConf(rightHandStabilityRef.current.confidence);
                handleRightHandGesture(rightGestureKey);
              }
            } else {
              rightHandStabilityRef.current = { gesture: rightGestureKey, count: 1, confidence: dualGestures.rightConfidence };
              setRightGesture(rightGestureKey);
              setRightConf(dualGestures.rightConfidence);
            }
          }

          // Display the most recent gesture for UI
          if (rightGestureKey !== "NONE") {
            setGesture(rightGestureKey);
            setConf(dualGestures.rightConfidence);
          } else if (leftGestureKey !== "NONE") {
            setGesture(leftGestureKey);
            setConf(dualGestures.leftConfidence);
          }
        }
      }
    }
    
    if (camOn) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [camOn, handleLeftHandGesture, handleRightHandGesture]);

  useEffect(() => {
    if (camOn) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              predictWebcam();
            };
          }
        })
        .catch(console.error);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setGesture("NONE");
      setLeftGesture("NONE");
      setRightGesture("NONE");
      setConf(0);
      setLeftConf(0);
      setRightConf(0);
      setBothHandsDetected(false);
    }
  }, [camOn, predictWebcam]);

  const toggleCamera = () => {
    setCamOn(prev => !prev);
  }

  if (!devices) return <div style={s.loading}>Loading devices…</div>

  const gMeta = GESTURE_META[gesture] ?? GESTURE_META["NONE"]
  const leftMeta = GESTURE_META[leftGesture] ?? GESTURE_META["NONE"]
  const rightMeta = GESTURE_META[rightGesture] ?? GESTURE_META["NONE"]

  return (
    <main style={s.root}>
      {/* ── Header ── */}
      <header style={s.header}>
        <span style={s.logo}>🖐 GestureControl</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {bothHandsDetected && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#a78bfa" }}>LEFT</span>
                <ConfRing conf={leftConfidence} />
                <span style={s.gestureChip}>{leftMeta.emoji} {leftMeta.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#67e8f9" }}>RIGHT</span>
                <ConfRing conf={rightConfidence} />
                <span style={s.gestureChip}>{rightMeta.emoji} {rightMeta.label}</span>
              </div>
            </>
          )}
          {!bothHandsDetected && (
            <>
              <ConfRing conf={confidence} />
              <span style={s.gestureChip}>{gMeta.emoji} {gMeta.label}</span>
            </>
          )}
          <span style={{
            ...s.badge,
            background: connected ? "#00ff9520" : "#ff444420",
            border: `1px solid ${connected ? "#00ff95" : "#ff4444"}`,
            color:  connected ? "#00ff95" : "#ff4444",
          }}>
            {connected ? "● Model Ready" : "● Loading Model..."}
          </span>
          {bothHandsDetected && (
            <span style={{
              ...s.badge,
              background: "#00ff9520",
              border: "1px solid #00ff95",
              color: "#00ff95",
            }}>
              ✓ Both Hands Detected
            </span>
          )}
        </div>
      </header>

      <div style={s.body}>
        {/* ── Left: video + gesture info ── */}
        <div style={s.leftCol}>
          <div style={s.videoWrap}>
            <video ref={videoRef} style={{...s.video, transform: "scaleX(-1)"}} playsInline muted />
            <canvas ref={canvasRef} width={640} height={480} style={{...s.video, position: "absolute", top: 0, left: 0, transform: "scaleX(-1)"}} />
            {!camOn && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#666" }}>
                Camera is OFF
              </div>
            )}
            <div style={s.videoLabel}>📷 Browser Camera</div>
            <button onClick={toggleCamera} style={{ position: 'absolute', top: 8, right: 8, background: '#111126', color: '#fff', borderRadius: 8, padding: '6px 8px', fontSize: 12, border: '1px solid #2e2e4e', cursor: 'pointer' }}>
              {camOn ? 'Stop Camera' : 'Start Camera'}
            </button>
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
            <button onClick={() => allOffLocal()} style={s.allOffBtn}>🖐 All Off</button>
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
