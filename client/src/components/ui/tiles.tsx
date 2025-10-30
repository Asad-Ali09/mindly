"use client"

import React, { useMemo, memo } from "react"
import { motion, MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface TilesProps {
  className?: string
  rows?: number
  cols?: number
  tileClassName?: string
  tileSize?: "sm" | "md" | "lg"
}

const tileSizes = {
  sm: "w-8 h-8",
  md: "w-9 h-9 md:w-12 md:h-12",
  lg: "w-12 h-12 md:w-16 md:h-16",
}

// Memoized individual tile component to prevent unnecessary re-renders
const Tile = memo(({ 
  tileSize, 
  tileClassName 
}: { 
  tileSize: keyof typeof tileSizes
  tileClassName?: string 
}) => {
  return (
    <motion.div
      whileHover={{
        backgroundColor: `rgba(191, 58, 13, 0.3)`,
        transition: { duration: 0 }
      }}
      animate={{
        transition: { duration: 2 }
      }}
      className={cn(
        tileSizes[tileSize],
        "border-r border-t border-[#bf3a0d]/40 relative",
        tileClassName
      )}
    />
  )
})

Tile.displayName = "Tile"

// Memoized column component
const TileColumn = memo(({ 
  colCount, 
  tileSize, 
  tileClassName,
  columnIndex
}: { 
  colCount: number
  tileSize: keyof typeof tileSizes
  tileClassName?: string
  columnIndex: number
}) => {
  const tiles = useMemo(() => {
    return Array.from({ length: colCount }, (_, j) => (
      <Tile 
        key={`tile-${columnIndex}-${j}`} 
        tileSize={tileSize}
        tileClassName={tileClassName}
      />
    ))
  }, [colCount, tileSize, tileClassName, columnIndex])

  return (
    <motion.div
      className={cn(
        tileSizes[tileSize],
        "border-l border-[#bf3a0d]/20 relative flex-shrink-0",
        tileClassName
      )}
    >
      {tiles}
    </motion.div>
  )
})

TileColumn.displayName = "TileColumn"

export const Tiles = memo(function Tiles({
  className,
  rows = 20,
  cols = 6,
  tileClassName,
  tileSize = "md",
}: TilesProps) {
  // Memoize the entire grid structure
  const grid = useMemo(() => {
    return Array.from({ length: rows }, (_, i) => (
      <TileColumn
        key={`col-${i}`}
        colCount={cols}
        tileSize={tileSize}
        tileClassName={tileClassName}
        columnIndex={i}
      />
    ))
  }, [rows, cols, tileSize, tileClassName])

  return (
    <div 
      className={cn(
        "absolute inset-0 z-0 flex w-full min-h-screen justify-center overflow-hidden",
        className
      )}
    >
      {grid}
    </div>
  )
})
