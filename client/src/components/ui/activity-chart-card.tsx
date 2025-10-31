import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CornerPlusIcons } from "@/components/ui/corner-plus-icons";

// Prop definition for individual data points
interface ActivityDataPoint {
  day: string;
  value: number;
}

// Prop definition for the component
interface ActivityChartCardProps {
  title?: string;
  totalValue: string;
  data: ActivityDataPoint[];
  className?: string;
  dropdownOptions?: string[];
  trendPercentage?: string;
  trendLabel?: string;
  isReduced?: boolean;
  // Dynamic values for different ranges
  weeklyTotal?: string;
  monthlyTotal?: string;
  yearlyTotal?: string;
  weeklyTrend?: string;
  monthlyTrend?: string;
  yearlyTrend?: string;
  weeklyLabel?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
}

/**
 * A responsive and animated card component to display weekly activity data.
 * Features a bar chart animated with Framer Motion and adapted to Surge AI theme.
 * Optimized for the dashboard with rust/orange accent colors.
 */
export const ActivityChartCard = ({
  title = "Activity",
  totalValue,
  data,
  className,
  dropdownOptions = ["Weekly", "Monthly", "Yearly"],
  trendPercentage = "+12%",
  trendLabel = "from last week",
  isReduced = false,
  weeklyTotal,
  monthlyTotal,
  yearlyTotal,
  weeklyTrend,
  monthlyTrend,
  yearlyTrend,
  weeklyLabel = "from last week",
  monthlyLabel = "from last month",
  yearlyLabel = "from last year",
}: ActivityChartCardProps) => {
  const [selectedRange, setSelectedRange] = React.useState(
    dropdownOptions[0] || ""
  );
  const [animated, setAnimated] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Generate appropriate labels based on selected range
  const displayData = React.useMemo(() => {
    if (selectedRange.toLowerCase() === 'yearly') {
      // For yearly: show month names
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return data.map((item, index) => ({
        ...item,
        day: months[index] || item.day
      }));
    } else if (selectedRange.toLowerCase() === 'monthly') {
      // For monthly: show week numbers
      return data.map((item, index) => ({
        ...item,
        day: `W${index + 1}`
      }));
    }
    // For weekly: keep original day names
    return data;
  }, [data, selectedRange]);

  // Find the maximum value in the data to normalize bar heights
  const maxValue = React.useMemo(() => {
    return displayData.reduce((max, item) => (item.value > max ? item.value : max), 0);
  }, [displayData]);

  // Find the peak bar index (Friday for weekly, last item for monthly/yearly)
  const peakIndex = React.useMemo(() => {
    if (selectedRange.toLowerCase() === 'weekly') {
      // Find "Fri" or "Friday" in the data
      const fridayIndex = displayData.findIndex(item => 
        item.day.toLowerCase().startsWith('fri')
      );
      return fridayIndex !== -1 ? fridayIndex : displayData.findIndex(item => item.value === maxValue);
    }
    // For monthly/yearly: highlight the last bar (most recent)
    return displayData.length - 1;
  }, [displayData, maxValue, selectedRange]);

  // Get dynamic values based on selected range
  const currentTotal = React.useMemo(() => {
    const range = selectedRange.toLowerCase();
    if (range === 'weekly') return weeklyTotal || totalValue;
    if (range === 'monthly') return monthlyTotal || totalValue;
    if (range === 'yearly') return yearlyTotal || totalValue;
    return totalValue;
  }, [selectedRange, weeklyTotal, monthlyTotal, yearlyTotal, totalValue]);

  const currentTrend = React.useMemo(() => {
    const range = selectedRange.toLowerCase();
    if (range === 'weekly') return weeklyTrend || trendPercentage;
    if (range === 'monthly') return monthlyTrend || trendPercentage;
    if (range === 'yearly') return yearlyTrend || trendPercentage;
    return trendPercentage;
  }, [selectedRange, weeklyTrend, monthlyTrend, yearlyTrend, trendPercentage]);

  const currentLabel = React.useMemo(() => {
    const range = selectedRange.toLowerCase();
    if (range === 'weekly') return weeklyLabel;
    if (range === 'monthly') return monthlyLabel;
    if (range === 'yearly') return yearlyLabel;
    return trendLabel;
  }, [selectedRange, weeklyLabel, monthlyLabel, yearlyLabel, trendLabel]);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [selectedRange]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle bar hover with debounce to prevent flickering
  const handleBarEnter = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredIndex(index);
  };

  const handleBarLeave = () => {
    // Add small delay before resetting to default to prevent flicker when moving between bars
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 50);
  };

  // Framer Motion variants for animations
  const chartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Faster stagger for smoother animation
      },
    },
  };

  const barVariants = {
    hidden: { scaleY: 0, opacity: 0, transformOrigin: "bottom" },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "bottom",
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <Card
      className={cn(
        "w-full max-w-full",
        "bg-[var(--dashboard-card-bg)] backdrop-blur-[20px]",
        "border border-dashed border-[var(--dashboard-card-border)]",
        "rounded-[var(--dashboard-radius-card)]",
        "shadow-[0_8px_30px_rgba(0,0,0,0.65)]",
        "hover:border-[var(--dashboard-accent-2)]",
        "transition-[border-color] duration-300",
        "relative group",
        className
      )}
      aria-labelledby="activity-card-title"
    >
      <CornerPlusIcons />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle 
            id="activity-card-title"
            className="text-lg font-semibold text-[var(--dashboard-text-primary)]"
          >
            {title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center gap-1 text-sm h-8 px-3",
                  "bg-[var(--dashboard-card-bg)] border border-dashed border-[var(--dashboard-card-border)]",
                  "hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--dashboard-accent-2)]",
                  "text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)]",
                  "rounded-lg transition-all duration-300"
                )}
                aria-haspopup="true"
              >
                {selectedRange}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="bg-[var(--dashboard-bg-end)] backdrop-blur-xl border-[var(--dashboard-card-border)]"
            >
              {dropdownOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onSelect={() => {
                    setSelectedRange(option);
                    setAnimated(false);
                  }}
                  className="text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-card-bg)]"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          {/* Total Value */}
          <div className="flex flex-col gap-1">
            <motion.p 
              key={`total-${selectedRange}`}
              className="text-5xl font-bold tracking-tighter text-[var(--dashboard-text-primary)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentTotal}
            </motion.p>
            <CardDescription className="flex items-center gap-1.5 text-[var(--dashboard-text-secondary)]">
              <TrendingUp className="h-4 w-4 text-[var(--dashboard-success)]" />
              <motion.span 
                key={`trend-${selectedRange}`}
                className="text-[var(--dashboard-success)] font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {currentTrend}
              </motion.span>
              <motion.span
                key={`label-${selectedRange}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                {currentLabel}
              </motion.span>
            </CardDescription>
          </div>

          {/* Bar Chart */}
          <motion.div
            key={selectedRange}
            className="flex h-32 w-full items-end justify-between gap-1.5 sm:gap-2"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            aria-label="Activity chart"
          >
            {displayData.map((item, index) => {
              const isPeak = index === peakIndex;
              const isHovered = hoveredIndex === index;
              const shouldFade = hoveredIndex !== null && hoveredIndex !== index;
              const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const showGlow = ((isPeak && hoveredIndex === null) || isHovered) && !isReduced;
              
              return (
                <div
                  key={`${index}-${selectedRange}`}
                  className="relative flex h-full w-full flex-col items-center justify-end gap-2 group"
                  role="presentation"
                  style={{ zIndex: isHovered ? 10 : 1 }}
                >
                  {/* Glow effect for peak bar (default) or hovered bar */}
                  <AnimatePresence mode="wait">
                    {showGlow && (
                      <motion.div
                        key={`glow-${index}`}
                        className="absolute bottom-8 w-full rounded-md"
                        style={{
                          height: `${barHeight}%`,
                          background: "linear-gradient(180deg, var(--dashboard-accent-1) 0%, var(--dashboard-accent-2) 100%)",
                          filter: "blur(14px)",
                          opacity: 0.5,
                          pointerEvents: "none",
                          zIndex: -1,
                        }}
                        initial={{ scale: 0.8 }}
                        animate={{ 
                          scale: 1,
                        }}
                        exit={{ scale: 0.8 }}
                        transition={{
                          scale: {
                            duration: 0.4,
                            ease: "easeOut"
                          }
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Main bar - This is the hover target */}
                  <motion.div
                    className={cn(
                      "relative w-full rounded-md cursor-pointer",
                      (isPeak && hoveredIndex === null) || isHovered
                        ? "bg-gradient-to-b from-[var(--dashboard-accent-1)] to-[var(--dashboard-accent-2)]" 
                        : "bg-[var(--dashboard-card-bg)]"
                    )}
                    style={{
                      height: `${barHeight}%`,
                    }}
                    variants={barVariants}
                    aria-label={`${item.day}: ${item.value} hours`}
                    onMouseEnter={() => handleBarEnter(index)}
                    onMouseLeave={handleBarLeave}
                    animate={{
                      opacity: shouldFade ? 0.3 : 1,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-[var(--dashboard-bg-end)] backdrop-blur-sm border border-[var(--dashboard-card-border)] rounded-lg px-2.5 py-1.5 shadow-xl">
                        <span className="text-xs font-semibold text-[var(--dashboard-text-primary)] whitespace-nowrap">
                          {item.value}h
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Day label */}
                  <span className="text-xs text-[var(--dashboard-muted)] font-medium">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};
