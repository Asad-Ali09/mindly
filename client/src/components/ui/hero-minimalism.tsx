"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import Link from "next/link";
import { AnimatedGroup } from "@/components/ui/animated-group";

// Memoized particle canvas component
const ParticleCanvas = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let rafId = 0;
    let particles: Particle[] = [];
    let isVisible = true;

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    // Cache dimensions to avoid repeated window property access
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const particleCount = () => Math.floor((width * height) / 10000);

    const createParticle = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.5,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const resetParticle = (p: Particle) => {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = Array.from({ length: particleCount() }, createParticle);
    };

    let lastTime = 0;
    const fps = 24; // Reduced to 24 FPS (cinematic) for smoother scrolling
    const frameDelay = 1000 / fps;

    const animate = (currentTime: number) => {
      if (!isVisible) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameDelay) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      
      lastTime = currentTime - (deltaTime % frameDelay);
      
      ctx.clearRect(0, 0, width, height);
      
      const now = Date.now();
      const len = particles.length;
      
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        p.y -= p.speed;
        
        if (p.y < 0) {
          resetParticle(p);
          continue;
        }
        
        if (!p.fadingOut && now > p.fadeStart) {
          p.fadingOut = true;
        }
        
        if (p.fadingOut) {
          p.opacity -= 0.01;
          if (p.opacity <= 0) {
            resetParticle(p);
            continue;
          }
        }
        
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, 0.6, 1.5);
      }
      
      rafId = requestAnimationFrame(animate);
    };

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setSize();
        init();
      }, 150);
    };

    // Intersection Observer to pause animation when not visible
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    
    observer.observe(canvas);

    setSize();
    init();
    rafId = requestAnimationFrame(animate);

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
});

ParticleCanvas.displayName = "ParticleCanvas";

// Animation variants for text reveal
const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function MinimalHero() {
  const handleStartLearning = useCallback(() => {
    window.location.href = '/learn';
  }, []);

  return (
    <section className="minimal-hero-root">
      {/* Header */}
      <header className="hero-header">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                y: -20,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: 'spring' as const,
                  bounce: 0.4,
                  duration: 1,
                },
              },
            },
          }}
          className="w-full flex justify-between items-center"
        >
          <div>
            <Link href="/" className="hero-brand">
              <span>Mindly</span>
            </Link>
          </div>
          <div>
            <button className="hero-cta" type="button" onClick={handleStartLearning}>
              Start Learning
            </button>
          </div>
        </AnimatedGroup>
      </header>

      {/* Particles */}
      <ParticleCanvas />

      {/* Accent Lines */}
      <div className="accent-lines" aria-hidden="true">
        <div className="accent-line h-line" />
        <div className="accent-line h-line" />
        <div className="accent-line h-line" />
        <div className="accent-line v-line" />
        <div className="accent-line v-line" />
        <div className="accent-line v-line" />
      </div>

      {/* Hero Content */}
      <main className="hero-content">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2,
                },
              },
            },
            ...transitionVariants,
          }}
        >
          <div>
            <div className="hero-kicker">AI-Powered Learning</div>
          </div>
          <div>
            <h1 className="hero-title">
              Learn Smarter.<br />Not Harder.
            </h1>
          </div>
          <div>
            <p className="hero-subtitle">
              Master any subject with personalized AI guidance that adapts to your pace.
            </p>
          </div>
        </AnimatedGroup>
      </main>

      {/* Footer */}
      <section className="hero-footer">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.5,
                },
              },
            },
            ...transitionVariants,
          }}
        >
          <div>
            <div className="footer-tag">Built for learners</div>
          </div>
          <div>
            <div className="footer-heading">Personalized. Interactive. Effective.</div>
          </div>
          <div>
            <p className="footer-desc">
              Experience AI-powered learning that understands your style, tracks your progress, and makes education engaging and effective.
            </p>
          </div>
        </AnimatedGroup>
      </section>
    </section>
  );
}
