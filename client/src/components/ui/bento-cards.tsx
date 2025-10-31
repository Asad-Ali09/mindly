"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"

const cardContents = [
  {
    title: "AI-Powered Lessons",
    description:
      "Experience personalized learning paths that adapt in real-time to your understanding and pace.",
  },
  {
    title: "Voice Interface",
    description:
      "Learn through natural conversation with advanced speech recognition and synthesis technology.",
  },
  {
    title: "Comprehensive Progress",
    description:
      "Track your learning journey with detailed analytics, milestones, and achievements. Our intelligent system provides insights into your strengths and areas for improvement, helping you optimize your study sessions. With real-time feedback and adaptive difficulty, you'll always be challenged at the right level.",
  },  
  {
    title: "Interactive Content",
    description:
      "Engage with dynamic lessons featuring 3D visualizations, interactive exercises, and real-world examples.",
  },
  {
    title: "Instant Feedback",
    description:
      "Get immediate corrections and explanations as you learn, ensuring you master concepts efficiently.",
  },
]

const PlusCard = memo<{
  className?: string
  title: string
  description: string
}>(function PlusCard({ className = "", title, description }) {
  return (
    <div
      className={cn(
        "relative border border-dashed border-[#bf3a0d]/40 rounded-lg p-6 bg-[#0A0B09] min-h-[200px]",
        "flex flex-col justify-between hover:border-[#bf3a0d]/60 transition-colors duration-300",
        "group",
        className
      )}
    >
      <CornerPlusIcons />
      {/* Content */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-bold text-[#fafafa] group-hover:text-[#bf3a0d] transition-colors duration-300">
          {title}
        </h3>
        <p className="text-[#fafafa]/70">{description}</p>
      </div>
    </div>
  )
})

const CornerPlusIcons = memo(function CornerPlusIcons() {
  return (
    <>
      <PlusIcon className="absolute -top-3 -left-3" />
      <PlusIcon className="absolute -top-3 -right-3" />
      <PlusIcon className="absolute -bottom-3 -left-3" />
      <PlusIcon className="absolute -bottom-3 -right-3" />
    </>
  )
})

const PlusIcon = memo<{ className?: string }>(function PlusIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      strokeWidth="1"
      stroke="currentColor"
      className={cn("text-[#bf3a0d] size-6 transition-transform duration-300 group-hover:scale-125", className)}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  )
})

export default function BentoCards() {
  return (
    <div className="mx-auto max-w-6xl border-x border-[#bf3a0d]/20 px-6 lg:px-8">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-auto gap-4">
        <PlusCard {...cardContents[0]} className="lg:col-span-3 lg:row-span-2" />
        <PlusCard {...cardContents[1]} className="lg:col-span-2 lg:row-span-2" />
        <PlusCard {...cardContents[2]} className="lg:col-span-4 lg:row-span-1" />
        <PlusCard {...cardContents[3]} className="lg:col-span-2 lg:row-span-1" />
        <PlusCard {...cardContents[4]} className="lg:col-span-2 lg:row-span-1" />
      </div>
    </div>
  )
}
