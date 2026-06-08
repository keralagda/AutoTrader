'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface SplitTextRevealProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function SplitTextReveal({
  text,
  className = '',
  delay = 0,
  duration = 0.8,
  tag = 'h2',
}: SplitTextRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10%' })

  const words = text.split(' ')

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  }

  const childVariants = {
    hidden: {
      y: '110%',
      rotate: 8,
    },
    visible: {
      y: 0,
      rotate: 0,
      transition: {
        duration: duration || 0.9,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  const Tag = tag

  return (
    <Tag ref={ref} className={`overflow-hidden ${className}`}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="inline-flex flex-wrap"
      >
        {words.map((word, idx) => (
          <span key={idx} className="inline-block overflow-hidden mr-[0.25em] pb-[0.1em] -mb-[0.1em]">
            <motion.span variants={childVariants} className="inline-block origin-bottom">
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
