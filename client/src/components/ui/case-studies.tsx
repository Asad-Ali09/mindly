"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, memo, useRef } from "react";
import { GraduationCap, MessageSquare } from "lucide-react";
import {
  AnimatedCard as AnimatedCardChart,
  CardBody as CardBodyChart,
  CardDescription as CardDescriptionChart,
  CardTitle as CardTitleChart,
  CardVisual as CardVisualChart,
  Visual3,
} from "@/components/ui/animated-card-chart";
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
  Visual1,
} from "@/components/ui/animated-card";

// Avoid SSR hydration issues by loading react-countup on the client.
const CountUp = dynamic(() => import("react-countup"), { ssr: false });

/** Hook: respects user's motion preferences */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Utility: parse a metric like "98%", "3.8x", "$1,200+", "1.5M", "€23.4k" */
function parseMetricValue(raw: string) {
  const value = (raw ?? "").toString().trim();
  const m = value.match(
    /^([^\d\-+]*?)\s*([\-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(.*)$/
  );
  if (!m) {
    return { prefix: "", end: 0, suffix: value, decimals: 0 };
  }
  const [, prefix, num, suffix] = m;
  const normalized = num.replace(/,/g, "");
  const end = parseFloat(normalized);
  const decimals = (normalized.split(".")[1]?.length ?? 0);
  return {
    prefix: prefix ?? "",
    end: isNaN(end) ? 0 : end,
    suffix: suffix ?? "",
    decimals,
  };
}

/** Small component: one animated metric */
const MetricStat = memo(function MetricStat({
  value,
  label,
  sub,
  duration = 1.6,
}: {
  value: string;
  label: string;
  sub?: string;
  duration?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const { prefix, end, suffix, decimals } = parseMetricValue(value);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div 
      ref={countRef}
      className="flex flex-col gap-3 text-left p-6 rounded-lg bg-[#0A0B09] border border-[#bf3a0d]/20 hover:border-[#bf3a0d]/40 transition-colors duration-300"
    >
      <p
        className="text-3xl font-bold text-[#bf3a0d] sm:text-4xl"
        aria-label={`${label} ${value}`}
      >
        {prefix}
        {reduceMotion || !isVisible ? (
          <span>
            {end.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
          </span>
        ) : (
          <CountUp
            start={0}
            end={end}
            decimals={decimals}
            duration={duration}
            separator=","
          />
        )}
        {suffix && (suffix.startsWith(' ') ? suffix : ` ${suffix}`)}
      </p>
      <p className="font-semibold text-[#fafafa] text-left text-lg">
        {label}
      </p>
      {sub ? (
        <p className="text-[#fafafa]/60 text-left text-sm">{sub}</p>
      ) : null}
    </div>
  );
});

export default function Casestudies() {
  const caseStudies = [
    {
      id: 1,
      type: "chart" as const,
      quote:
        "Static lectures fail to engage multiple senses, causing fast knowledge decay.",
      name: "Traditional Learning",
      role: "Research-Backed Data",
      mainColor: "#bf3a0d",
      secondaryColor: "#ff6900",
      icon: GraduationCap,
      cardTitle: "Only 30% Retention After 2 Days",
      cardDescription: "Static lectures fail to engage multiple senses, causing fast knowledge decay.",
      metrics: [
        { value: "2 days", label: "Average retention window", sub: "Information decay begins immediately" },
        { value: "70%", label: "Comprehension loss after first review", sub: "Without interactive reinforcement" },
        { value: "1.5x", label: "Slower concept mastery speed", sub: "vs. interactive AI learning" },
      ],
    },
    {
      id: 2,
      type: "line" as const,
      quote:
        "Conversational learning and visual explanations improve comprehension dramatically.",
      name: "AI-Powered Learning",
      role: "Evidence-Based Results",
      mainColor: "#d97706",
      secondaryColor: "#f59e0b",
      icon: MessageSquare,
      cardTitle: "Boosts Engagement and Retention",
      cardDescription: "Conversational learning and visual explanations improve comprehension dramatically.",
      metrics: [
        { value: "92%", label: "Average comprehension score improvement", sub: "Compared to traditional methods" },
        { value: "3x", label: "Faster concept mastery", sub: "Through interactive engagement" },
        { value: "85%", label: "Higher motivation to continue learning", sub: "Users report sustained engagement" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 border-x border-[#bf3a0d]/20">
      {/* Cases */}
      <div className="flex flex-col gap-16 md:gap-20">
          {caseStudies.map((study, idx) => {
            const reversed = idx % 2 === 1;
            const IconComponent = study.icon;
            return (
              <div
                key={study.id}
                className="grid gap-8 lg:grid-cols-3 xl:gap-16 items-start border-b border-[#bf3a0d]/20 pb-12 last:border-b-0"
              >
                {/* Left: Animated Card */}
                <div
                  className={[
                    "flex flex-col gap-6 lg:col-span-2 text-left justify-self-center",
                    reversed ? "lg:order-2" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-center w-full">
                    {study.type === "chart" ? (
                      <AnimatedCardChart className="w-full max-w-[400px]">
                        <CardVisualChart>
                          <Visual3 
                            mainColor={study.mainColor} 
                            secondaryColor={study.secondaryColor}
                          />
                        </CardVisualChart>
                        <CardBodyChart>
                          <CardTitleChart>{study.cardTitle}</CardTitleChart>
                          <CardDescriptionChart>{study.cardDescription}</CardDescriptionChart>
                        </CardBodyChart>
                      </AnimatedCardChart>
                    ) : (
                      <AnimatedCard className="w-full max-w-[400px]">
                        <CardVisual>
                          <Visual1 
                            mainColor={study.mainColor} 
                            secondaryColor={study.secondaryColor}
                          />
                        </CardVisual>
                        <CardBody>
                          <CardTitle>{study.cardTitle}</CardTitle>
                          <CardDescription>{study.cardDescription}</CardDescription>
                        </CardBody>
                      </AnimatedCard>
                    )}
                  </div>
                  
                  <figure className="flex flex-col gap-6 text-left max-w-[400px] mx-auto w-full">
                    <blockquote className="text-base sm:text-lg text-[#fafafa]/90 leading-relaxed text-left italic">
                      &ldquo;{study.quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-center gap-4 text-left border-t border-[#bf3a0d]/20 pt-4">
                      <div className="flex items-center justify-center p-3 rounded-lg bg-[#bf3a0d]/10 border border-[#bf3a0d]/40">
                        <IconComponent className="size-6 text-[#bf3a0d]" aria-hidden />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-[#fafafa]">
                          {study.name}
                        </span>
                        <span className="text-sm text-[#bf3a0d]">
                          {study.role}
                        </span>
                      </div>
                    </figcaption>
                  </figure>
                </div>

                {/* Right: Metrics */}
                <div
                  className={[
                    "grid grid-cols-1 gap-6 self-center text-left",
                    reversed ? "lg:order-1" : "",
                  ].join(" ")}
                >
                  {study.metrics.map((metric, i) => (
                    <MetricStat
                      key={`${study.id}-${i}`}
                      value={metric.value}
                      label={metric.label}
                      sub={metric.sub}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}
