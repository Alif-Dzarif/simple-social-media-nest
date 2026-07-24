export const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'], // .mov = quicktime
};

export const SIZE_LIMITS = {
  image: Number(process.env.IMAGE_SIZE_LIMIT ?? 5) * 1024 * 1024,
  video: Number(process.env.VIDEO_SIZE_LIMIT ?? 100) * 1024 * 1024,
};