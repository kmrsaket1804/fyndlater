import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  variant?: 'full' | 'icon';
  href?: string;
};

const logoConfig = {
  full: {
    src: '/assets/fyndlater-logo.png',
    width: 925,
    height: 270,
    className: 'h-8 w-auto sm:h-9',
  },
  icon: {
    src: '/assets/fyndlater-logo-sq.png',
    width: 389,
    height: 388,
    className: 'h-9 w-9',
  },
} as const;

export function Logo({
  className,
  variant = 'full',
  href = '/',
}: LogoProps) {
  const config = logoConfig[variant];

  return (
    <Link
      href={href}
      className={cn('inline-flex shrink-0 items-center', className)}
    >
      <Image
        src={config.src}
        alt="FyndLater"
        width={config.width}
        height={config.height}
        className={config.className}
        priority={variant === 'full'}
      />
    </Link>
  );
}
