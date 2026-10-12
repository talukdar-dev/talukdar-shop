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
 * Optimized image component.
 * - Cloudinary URLs: plain <img> with f_auto,q_auto + width transform (fastest, CDN-direct)
 * - Data URIs: plain <img> (next/image cannot handle)
 * - Others: next/image
 */
function optimize(src: string, width?: number): string {
  if (
    src.includes('res.cloudinary.com') &&
    src.includes('/image/upload/')
  ) {
    const w = width && width < 800 ? `w_${width},` : 'w_800,';
    // Replace any existing transform with optimized one
    return src.replace(
      /\/image\/upload\/(f_auto[^/]*\/)?(v\d+\/)?/,
      `/image/upload/f_auto,q_auto,${w}`
    );
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
  const isCloudinary = src.includes('res.cloudinary.com');
  src = optimize(src, width);
  if (src.startsWith('data:') || isCloudinary) {
    // Cloudinary: direct CDN (fastest). Data URI: next/image can't handle.
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          loading={priority ? 'eager' : 'lazy'}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
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
