'use client';

import { useEffect, useState } from 'react';
import LiquidEther from './reactbits/LiquidEther';
import BlurText from "./reactbits/BlurText";
import TextPressure from './reactbits/TextPressure';
import Antigravity from './reactbits/Antigravity';
import { AnimatedShinyButton } from "./ui/animated-shiny-button";

const Hero = () => {
  // 🔥 key to force re-mount (replay animation)
  const [animationKey, setAnimationKey] = useState(0);

  // 🔥 scroll detection
  useEffect(() => {
    let lastTrigger = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      // trigger when user comes back near hero (top)
      if (scrollY < window.innerHeight * 0.3 && Date.now() - lastTrigger > 1000) {
        setAnimationKey(prev => prev + 1);
        lastTrigger = Date.now();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="hero-root">

      {/* 🔥 Background */}
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

      {/* 🔥 Content */}
      <div className="hero-content">

        <div className="hero-text-block">
          <BlurText
            key={animationKey} // 🔥 THIS TRIGGERS REPLAY
            text="Explore the magic of"
            delay={700}
            animateBy="words"
            direction="top"
            className="hero-blur"
          />

          <TextPressure
            text="GESTURES!"
            flex
            stroke={false}
            weight
            textColor="#ffffff"
            strokeColor="#5227FF"
            minFontSize={180}
            className="big-shoulders hero-pressure"
          />
        </div>

        {/* 🔥 Button (clickable) */}
        <div className="hero-actions">
          <AnimatedShinyButton
            onClick={() => console.log('clicked')}
            className="hero-button"
          >
            Try now!
          </AnimatedShinyButton>
        </div>

      </div>

      {/* 🔥 Styles */}
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
          gap: 24px;
          padding: 0 24px;
          text-align: center;

          pointer-events: none;
          z-index: 10;
        }

        .hero-text-block {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .hero-blur {
          font-size: 25px;
          color: white;
          display: flex;
          justify-content: center;
          gap: 8px;
          line-height: 1;
        }

        .hero-pressure {
          line-height: 1;
          text-align: center;
        }

        .hero-actions {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-button {
          width: 200px;
        }
      `}</style>
    </div>
  );
};

export default Hero;
