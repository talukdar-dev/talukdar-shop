// Cloudinary helpers — image upload (admin) + optimized delivery URLs.
// Works only when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (+ unsigned preset for
// uploads) is configured; otherwise the app falls back to SVG placeholders.

export function cloudinaryConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

/** Optimized Cloudinary delivery URL for a public ID or full URL. */
export function cldUrl(
  src: string,
  w = 800,
): string {
  if (!src || src.startsWith('data:')) return src;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return src;
  // already a cloudinary URL → inject transform
  if (src.includes('res.cloudinary.com')) {
    return src.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
  }
  // treat as public ID
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${src}`;
}

/** Upload a File to Cloudinary using an unsigned preset. Returns the secure URL. */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error(
      'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
    );
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    { method: 'POST', body: fd },
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json();
  return json.secure_url as string;
}
