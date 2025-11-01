'use client';

import dynamic from 'next/dynamic';

// Dynamically import the lesson component with SSR disabled to prevent 3D asset loading during build
const LessonClient = dynamic(() => import('./LessonClient'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#141712] text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="mt-4">Loading lesson...</p>
      </div>
    </div>
  ),
});

export default function LessonPage() {
  return <LessonClient />;
}
