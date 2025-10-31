"use client";


export function QuoteSection() {
  return (
    <div className="relative min-h-screen w-full bg-[#0A0B09] flex items-center justify-center py-20">
      <div className="mx-auto max-w-7xl px-6 w-full">
        <div className="relative flex flex-col items-center border border-[#bf3a0d]">


          <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-[#bf3a0d]" />
          <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-[#bf3a0d]" />
          <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-[#bf3a0d]" />
          <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-[#bf3a0d]" />

          <div className="relative z-20 mx-auto max-w-7xl rounded-[40px] py-6 md:p-10 xl:py-20">
            <p className="md:text-md text-xs text-[#bf3a0d] lg:text-lg xl:text-2xl">
              We believe
            </p>
            <div className="text-2xl tracking-tighter md:text-5xl lg:text-7xl xl:text-8xl text-white">
              <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <h1 className="font-semibold">"Learning should be</h1>
                <p className="font-thin">easy to</p>
              </div>
              <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <p className="font-thin">understand</p>
                <h1 className="font-semibold">because</h1>
                <p className="font-thin">simple</p>
              </div>
              <div className="flex gap-1 md:gap-2 lg:gap-3 xl:gap-4">
                <p className="font-thin">concepts</p>
                <h1 className="font-semibold">are quicker to</h1>
              </div>
              <h1 className="font-semibold">grasp..."</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
