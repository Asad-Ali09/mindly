"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";
import { AnimatedGroup } from "@/components/ui/animated-group";

export const CallToAction = memo(function CallToAction() {
  return (
    <section className="relative bg-[#0A0B09] py-16 md:py-24">
      <div className="mx-auto max-w-6xl border-x border-[#bf3a0d]/20 bg-[radial-gradient(35%_80%_at_30%_0%,hsl(16_89%_40%/.08),transparent)]">
        {/* Top Border */}
        <div className="absolute inset-x-0 top-0 h-px w-full bg-[#bf3a0d]/40" />
        
        <div className="relative mx-auto flex w-full flex-col justify-between gap-y-6 px-6 py-12 md:px-8 md:py-16">
          {/* Corner Plus Icons */}
          <PlusIcon
            className="absolute top-[-12.5px] left-[-11.5px] z-10 size-6 text-[#bf3a0d]"
            strokeWidth={1.5}
          />
          <PlusIcon
            className="absolute top-[-12.5px] right-[-11.5px] z-10 size-6 text-[#bf3a0d]"
            strokeWidth={1.5}
          />
          <PlusIcon
            className="absolute bottom-[-12.5px] left-[-11.5px] z-10 size-6 text-[#bf3a0d]"
            strokeWidth={1.5}
          />
          <PlusIcon
            className="absolute right-[-11.5px] bottom-[-12.5px] z-10 size-6 text-[#bf3a0d]"
            strokeWidth={1.5}
          />

          {/* Center Dashed Line */}
          <div className="-z-10 absolute top-0 left-1/2 h-full border-l border-dashed border-[#bf3a0d]/20" />

          {/* Content */}
          <div className="space-y-2">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                },
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
              }}
            >
              <div>
                <h2 className="text-center font-bold text-3xl md:text-4xl text-[#fafafa]">
                  Start Your AI Learning Journey
                </h2>
              </div>
            </AnimatedGroup>
            <p className="text-center text-[#fafafa]/70 text-base md:text-lg">
              Experience personalized education powered by advanced AI. No credit card required.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-transparent border-[#bf3a0d]/40 text-[#fafafa] hover:bg-[#bf3a0d]/10 hover:border-[#bf3a0d] transition-all duration-300 w-full sm:w-auto"
            >
              View Demo
            </Button>
            <Button 
              size="lg"
              className="bg-[#bf3a0d] text-white hover:bg-[#d94711] transition-all duration-300 w-full sm:w-auto shadow-lg shadow-[#bf3a0d]/20"
            >
              Get Started <ArrowRightIcon className="size-4 ml-2" />
            </Button>
          </div>
        </div>
        
        {/* Bottom Border */}
        <div className="absolute inset-x-0 bottom-0 h-px w-full bg-[#bf3a0d]/40" />
      </div>
    </section>
  );
});
