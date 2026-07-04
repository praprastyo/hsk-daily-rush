import React from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../../utils/soundSynth';
import { useHaptic } from '../../hooks/useHaptic';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'info' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
  soundType?: 'click' | 'ding' | 'buzz' | 'whoosh' | 'chime';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  hapticIntensity = 'light',
  soundType = 'click',
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const triggerHaptic = useHaptic();

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Trigger audio feedback
    playSound(soundType);

    // Trigger haptic feedback
    triggerHaptic(hapticIntensity);

    // Call user's custom onClick if present
    if (onClick) {
      onClick(e);
    }
  };

  // Base styling for Duolingo 3D Button
  const baseClasses = "relative font-bold select-none cursor-pointer rounded-2xl transition-all active:translate-y-[4px] outline-hidden active:border-b-0";

  // Sizing styles
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg w-full",
  };

  // Color theme definitions (Top layer & 3D Shadow layer)
  const variantClasses = {
    // Saweria Vibe: Yellow #FFD100, Text #111111, Darker yellow shadow/border
    primary: disabled 
      ? "bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed active:translate-y-0"
      : "bg-[#FFD100] text-[#111111] border-b-[6px] border-[#C29D00] hover:bg-[#FFE04D] active:border-b-[2px]",
    
    // Duolingo Success Vibe: Green #58CC02
    success: disabled
      ? "bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed active:translate-y-0"
      : "bg-[#58CC02] text-white border-b-[6px] border-[#46A302] hover:bg-[#68E20B] active:border-b-[2px]",

    // Duolingo Wrong/Error Vibe: Red #FF4B4B
    danger: disabled
      ? "bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed active:translate-y-0"
      : "bg-[#FF4B4B] text-white border-b-[6px] border-[#EA2B2B] hover:bg-[#FF6666] active:border-b-[2px]",

    // Duolingo Info Vibe: Blue #1CB0F6
    info: disabled
      ? "bg-gray-300 text-gray-500 border-b-4 border-gray-400 cursor-not-allowed active:translate-y-0"
      : "bg-[#1CB0F6] text-white border-b-[6px] border-[#1899D6] hover:bg-[#35C4FF] active:border-b-[2px]",

    // Light minimal button style
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 border-0 active:translate-y-0 shadow-none",
  };

  // Destructure custom props to avoid passing non-motion/conflicting handlers to motion.button
  const { 
    type, 
    ...cleanProps 
  } = props;

  return (
    <motion.button
      type={type || 'button'}
      whileTap={disabled ? {} : { y: 4 }}
      transition={{ type: 'spring', stiffness: 600, damping: 25 }}
      onClick={handlePress}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...(cleanProps as any)}
    >
      {children}
    </motion.button>
  );
};
