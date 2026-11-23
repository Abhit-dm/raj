import imageCompression from 'browser-image-compression';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API_BASE_URL: string = import.meta.env.VITE_API_URL || '/api';
/* Without Cloudinary config, files are stored by our own backend instead */
const USE_CLOUDINARY = Boolean(CLOUD_NAME && UPLOAD_PRESET);
/* Origin of the backend when the API URL is absolute (mobile app), '' when proxied (web dev) */
const API_ORIGIN = /^https?:\/\//.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : '';

/* Per-document compression settings */
const COMPRESS_OPTIONS: Record<string, { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }> = {
  PROFILE_PHOTO:          { maxSizeMB: 0.5,  maxWidthOrHeight: 1200, initialQuality: 0.75 },
  AADHAAR_CARD:           { maxSizeMB: 1,    maxWidthOrHeight: 1600, initialQuality: 0.80 },
  DRIVING_LICENCE_FRONT:  { maxSizeMB: 1,    maxWidthOrHeight: 1600, initialQuality: 0.80 },
  DRIVING_LICENCE_BACK:   { maxSizeMB: 1,    maxWidthOrHeight: 1600, initialQuality: 0.80 },
  ADDRESS_PROOF:          { maxSizeMB: 1,    maxWidthOrHeight: 1600, initialQuality: 0.80 },
  PAN_CARD:               { maxSizeMB: 1,    maxWidthOrHeight: 1600, initialQuality: 0.80 },
};

/* PDF hard limit — cannot compress in browser */
const PDF_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export interface CloudinaryResult {
  url: string;
  publicId: string;
  bytes: number;         // final size after compression
  originalBytes: number; // original size before compression
}

export async function uploadDocument(
  file: File,
  documentType: string,
  folder = 'driver-registration'
): Promise<CloudinaryResult> {
  const isPDF = file.type === 'application/pdf';

  if (isPDF && file.size > PDF_MAX_BYTES) {
    throw new Error(`PDF too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 2 MB. Try scanning at lower quality or use a JPG photo.`);
  }

  const originalBytes = file.size;
  let fileToUpload: File = file;

  /* Compress images — skip PDFs */
  if (!isPDF) {
    const opts = COMPRESS_OPTIONS[documentType] ?? { maxSizeMB: 1, maxWidthOrHeight: 1600, initialQuality: 0.80 };
    fileToUpload = await imageCompression(file, {
      ...opts,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
  }

  if (!USE_CLOUDINARY) return uploadToBackend(fileToUpload, file.name, originalBytes);

  /* Upload to Cloudinary */
  const fd = new FormData();
  fd.append('file', fileToUpload);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', folder);
  fd.append('resource_type', isPDF ? 'raw' : 'image');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${isPDF ? 'raw' : 'image'}/upload`,
    { method: 'POST', body: fd }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Cloudinary upload failed');
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes,
    originalBytes,
  };
}

async function uploadToBackend(fileToUpload: File, originalName: string, originalBytes: number): Promise<CloudinaryResult> {
  const fd = new FormData();
  // Compressed images come back as image/jpeg; keep a matching extension so the server accepts them
  const name = fileToUpload.type === 'image/jpeg' ? originalName.replace(/\.[^.]+$/, '') + '.jpg' : originalName;
  fd.append('file', fileToUpload, name);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/uploads`, { method: 'POST', body: fd });
  } catch {
    throw new Error('Cannot reach server. Check your connection.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Upload failed');

  return {
    url: `${API_ORIGIN}${body.data.url}`,
    publicId: body.data.url,
    bytes: body.data.bytes,
    originalBytes,
  };
}
