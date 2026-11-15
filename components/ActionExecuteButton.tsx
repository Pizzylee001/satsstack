'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ActionExecuteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function ActionExecuteButton({
  variant = 'primary',
  isLoading = false,
  loadingText = 'Executing...',
  disabled = false,
  children,
  className = '',
  onClick,
  ...props
}: ActionExecuteButtonProps) {
  const [isDebounced, setIsDebounced] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || isDebounced) return;
    setIsDebounced(true);
    setTimeout(() => setIsDebounced(false), 600);
    if (onClick) onClick(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2.5 transition-all outline-none focus-visible:outline-2 focus-visible:outline-[#F59E0B] focus-visible:outline-offset-2 btn-press cursor-pointer disabled:cursor-not-allowed select-none';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles =
      'bg-[#F59E0B] hover:bg-[#D97706] text-[#0E1116] font-semibold disabled:bg-[#F59E0B]/30 disabled:text-[#0E1116]/60 shadow-sm';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-[#181D24] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#374254] text-[#F0F4F8] disabled:bg-[#181D24]/40 disabled:border-[#262E3B]/40 disabled:text-[#8B95A5]/40';
  } else if (variant === 'danger') {
    variantStyles =
      'bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/40 disabled:opacity-40';
  }

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
