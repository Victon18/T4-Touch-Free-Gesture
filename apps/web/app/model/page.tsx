"use client"
import { useEffect, useState, useRef } from "react"
import { initGestureRecognizer, getGestureRecognizer, detectCustomGestures } from "@/lib/gesture"

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
  const [connected, setConnected] = useState(false)
  const [fps, setFps]             = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>(0)
  const lastVideoTimeRef = useRef(-1)
  const framesRef = useRef(0)
  const lastFpsTimeRef = useRef(Date.now())

  useEffect(() => {
    let mounted = true;
    async function setup() {
      try {
        await initGestureRecognizer();
        if (!mounted) return;
        setConnected(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            predictWebcam();
          };
        }
      } catch (e) {
        console.error(e);
        setConnected(false);
      }
    }
    setup();

    return () => {
      mounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const predictWebcam = () => {
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
            for (const landmarks of results.landmarks) {
              ctx.fillStyle = "#00ff00";
              for (const lm of landmarks) {
                ctx.beginPath();
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        }

        let detectedGesture = "None";
        if (results.gestures && results.gestures.length > 0 && results.gestures[0] && results.gestures[0].length > 0 && results.gestures[0][0]) {
          const categoryName = results.gestures[0][0].categoryName;
          detectedGesture = categoryName;
          if (detectedGesture === "None" && results.landmarks && results.landmarks.length > 0 && results.landmarks[0]) {
            const custom = detectCustomGestures(results.landmarks[0]);
            if (custom) detectedGesture = custom;
          }
        }
        
        if (detectedGesture === "Victory") detectedGesture = "Peace";
        if (detectedGesture === "Pointing_Up") detectedGesture = "Pointing";
        if (detectedGesture === "Thumb_Up") detectedGesture = "Thumbs Up";
        if (detectedGesture === "Thumb_Down") detectedGesture = "Thumbs Down";
        if (detectedGesture === "Closed_Fist") detectedGesture = "Fist";
        if (detectedGesture === "Open_Palm") detectedGesture = "Open Palm";
        if (detectedGesture === "ILoveYou") detectedGesture = "Rock";

        setGesture(detectedGesture);

        framesRef.current++;
        const now = Date.now();
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(Math.round((framesRef.current * 1000) / (now - lastFpsTimeRef.current)));
          framesRef.current = 0;
          lastFpsTimeRef.current = now;
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

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
            <video
              ref={videoRef}
              style={{...styles.video, transform: "scaleX(-1)"}} // mirror
              playsInline
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{...styles.video, position: "absolute", top: 0, left: 0, transform: "scaleX(-1)"}} // mirror canvas too
            />
            {/* Overlay: gesture pill */}
            <div style={styles.overlay}>
              <span style={styles.gesturePill}>{gesture}</span>
              <span style={styles.fpsBadge}>{fps} fps</span>
            </div>
          </div>
          <p style={styles.hint}>Hand landmarks are drawn in real-time in the browser</p>
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

