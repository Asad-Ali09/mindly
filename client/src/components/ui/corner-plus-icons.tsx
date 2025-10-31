import { memo } from 'react'
import { cn } from '@/lib/utils'

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
      className={cn('text-[#bf3a0d] size-6 transition-transform duration-300 group-hover:scale-125', className)}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  )
})

export const CornerPlusIcons = memo(function CornerPlusIcons() {
  return (
    <>
      <PlusIcon className="absolute -top-3 -left-3 z-10" />
      <PlusIcon className="absolute -top-3 -right-3 z-10" />
      <PlusIcon className="absolute -bottom-3 -left-3 z-10" />
      <PlusIcon className="absolute -bottom-3 -right-3 z-10" />
    </>
  )
})
