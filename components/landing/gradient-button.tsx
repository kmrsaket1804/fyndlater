import Link from 'next/link';
import { cn } from '@/lib/utils';

type GradientButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'lg';
  onClick?: () => void;
};

export function GradientButton({
  href,
  children,
  className,
  size = 'default',
  onClick,
}: GradientButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium text-white rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 transition-all shadow-md shadow-violet-200/50 hover:shadow-lg hover:shadow-violet-200/60',
    size === 'lg' ? 'px-8 py-3.5 text-base' : 'px-6 py-2.5 text-sm',
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
