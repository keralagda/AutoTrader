'use client'

import React from 'react'

interface InfiniteMarqueeProps {
  items: string[]
  speed?: number // Duration in seconds
  reverse?: boolean
}

export function InfiniteMarquee({ items, speed = 25, reverse = false }: InfiniteMarqueeProps) {
  // Double the items array to create a seamless looping effect
  const repeatedItems = [...items, ...items, ...items]

  return (
    <div className="relative w-full overflow-hidden py-3 bg-[#070708]/80 border-y border-white/[0.04] backdrop-blur-sm select-none z-10 flex">
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes marquee-loop {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-33.3333%, 0, 0);
          }
        }
        @keyframes marquee-loop-reverse {
          0% {
            transform: translate3d(-33.3333%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-marquee-track {
          animation: marquee-loop ${speed}s linear infinite;
        }
        .animate-marquee-track-reverse {
          animation: marquee-loop-reverse ${speed}s linear infinite;
        }
      `}</style>

      <div
        className={`flex whitespace-nowrap gap-16 min-w-full px-4 ${
          reverse ? 'animate-marquee-track-reverse' : 'animate-marquee-track'
        }`}
      >
        {repeatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm font-semibold tracking-wider uppercase font-mono text-white/50">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
