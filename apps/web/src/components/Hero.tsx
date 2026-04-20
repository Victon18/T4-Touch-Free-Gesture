'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Antigravity from './Antigravity';
import BlurText from "./BlurText";
import TextPressure from './TextPressure';
import { AnimatedShinyButton } from "./ui/animated-shiny-button"

const Hero = () => {
  const router = useRouter();
  return (
    <div className="hero-root">
      {/* Full-screen particle background */}
      <div className="hero-canvas">
        <Antigravity
          count={320}
          magnetRadius={12}
          ringRadius={12}
          waveSpeed={0.35}
          waveAmplitude={1.2}
          particleSize={2}
          lerpSpeed={0.09}
          color="#9fc9ff"
          autoAnimate={false}
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Hero text overlay */}
      <div className="hero-content">

<div className="relative h-[300px] flex flex-col items-center justify-center">

  <BlurText
    text="Explore the magic of"
    delay={700}
    animateBy="words"
    direction="top"
    className="text-[25px] text-center tracking-tight leading-none flex justify-center gap-2 text-white"
  />

  <TextPressure
    text="GESTURES!"
    flex
    stroke={false}
    weight
    textColor="#ffffff"
    strokeColor="#5227FF"
    minFontSize={180} // base size
    className="big-shoulders text-center leading-none"
  />

</div>
<div style={{display: 'flex', gap: 12, alignItems: 'center', pointerEvents: 'auto'}}>
<AnimatedShinyButton onClick={()=>console.log('button')} className="w-full">
  Try now!
</AnimatedShinyButton>
</div>

      </div>
      <style jsx>{`
        .hero-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          overflow: hidden;
        }

        .hero-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          text-align: center;
          padding: 0 1.5rem;
          pointer-events: none;
        }

        .hero-badge {
          pointer-events: auto;
          display: inline-block;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          border: 1px solid rgba(159, 201, 255, 0.3);
          background: rgba(159, 201, 255, 0.08);
          color: #9fc9ff;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 800;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.03em;
          pointer-events: auto;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, #9fc9ff 0%, #6ea8ff 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          margin: 0;
          max-width: 480px;
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          font-weight: 400;
          pointer-events: auto;
        }

        .hero-cta {
          pointer-events: auto;
          margin-top: 0.5rem;
          padding: 0.75rem 2rem;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #6ea8ff, #a78bfa);
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.02em;
          box-shadow: 0 0 30px rgba(110, 168, 255, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 45px rgba(110, 168, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Hero;
