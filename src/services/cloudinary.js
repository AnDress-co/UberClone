import { ENV } from '../config/env';

export async function uploadImage(uri, folder = 'uberclone-driver') {
  const form = new FormData();
  form.append('file', { uri, type: 'image/jpeg', name: `${Date.now()}.jpg` });
  form.append('upload_preset', ENV.cloudinaryUploadPreset);
  form.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${ENV.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error('UPLOAD_FAILED');
  return data.secure_url;
}