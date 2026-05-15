'use client';

const sizes = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
};

const iconSizes = {
  sm: 'w-[42%] h-[42%]',
  md: 'w-[45%] h-[45%]',
  lg: 'w-[46%] h-[46%]',
};

export default function LogoMark({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-accent text-white shadow-md shadow-accent/15 ring-1 ring-white/10 ${sizes[size]} ${className}`}
      aria-hidden
    >
      <svg
        className={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19V5M12 19V9M20 19v-6" />
      </svg>
    </div>
  );
}
