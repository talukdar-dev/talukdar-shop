import Image from 'next/image';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

/**
 * next/image for remote URLs, plain <img> for data: URIs
 * (demo SVG placeholders are data URIs which next/image cannot handle).
 * Cloudinary URLs get automatic format + quality optimization.
 */
function optimize(src: string): string {
  if (
    src.includes('res.cloudinary.com') &&
    src.includes('/image/upload/') &&
    !src.includes('/f_auto')
  ) {
    return src.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  return src;
}

export default function SmartImage({
  src,
  alt,
  className,
  width = 800,
  height = 800,
  fill = false,
  sizes,
  priority = false,
}: SmartImageProps) {
  if (!src) return null;
  src = optimize(src);
  if (src.startsWith('data:')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        draggable={false}
      />
    );
  }
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 50vw, 25vw'}
        className={className}
        priority={priority}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
