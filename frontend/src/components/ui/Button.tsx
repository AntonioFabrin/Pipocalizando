import { motion, type HTMLMotionProps } from 'motion/react';
import React from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-cinema-red text-white hover:bg-cinema-red/90 shadow-[0_0_20px_-5px_rgba(229,9,20,0.5)]',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    ghost: 'bg-transparent text-white hover:bg-white/5',
    glass: 'glass text-white hover:bg-white/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm font-medium',
    lg: 'px-8 py-3.5 text-base font-semibold uppercase tracking-wider',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cinema-red/50 disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === 'primary' && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          initial={false}
        />
      )}
    </motion.button>
  );
}
