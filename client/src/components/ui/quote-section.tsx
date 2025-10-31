"use client";

import { memo } from "react";
import DotPattern from "@/components/ui/dot-pattern";

const CornerDecoration = memo(function CornerDecoration({ position }: { position: string }) {
  return <div className={`absolute ${position} h-3 w-3 bg-[#bf3a0d]`} />;
});

const QuoteSection = memo(function QuoteSection() {
  return (
    <div className="mx-auto my-16 md:my-24 lg:my-32 max-w-7xl px-6 xl:px-0 bg-[#0A0B09]">
      <div className="relative flex flex-col items-center border border-[#bf3a0d]/40 bg-[#0A0B09]">
        <DotPattern width={5} height={5} className="fill-[#bf3a0d]/10" />

        <CornerDecoration position="-left-1.5 -top-1.5" />
        <CornerDecoration position="-bottom-1.5 -left-1.5" />
        <CornerDecoration position="-right-1.5 -top-1.5" />
        <CornerDecoration position="-bottom-1.5 -right-1.5" />

        <div className="relative z-20 mx-auto max-w-7xl rounded-[40px] py-6 md:p-10 xl:py-20">
          <p className="md:text-md text-xs text-[#bf3a0d] lg:text-lg xl:text-2xl">
            We believe
          </p>
          <div className="text-2xl tracking-tighter text-[#fafafa] md:text-5xl lg:text-7xl xl:text-8xl">
            <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
              <h2 className="font-semibold">"Learning should be</h2>
              <p className="font-thin">easy to</p>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
              <p className="font-thin">understand</p>
              <h2 className="font-semibold">because</h2>
              <p className="font-thin">simple</p>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-2 lg:gap-3 xl:gap-4">
              <p className="font-thin">concepts</p>
              <h2 className="font-semibold">are quicker to</h2>
            </div>
            <h2 className="font-semibold">master..."</h2>
          </div>
        </div>
      </div>
    </div>
  );
});

export default QuoteSection;
