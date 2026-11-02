import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { ENV } from '../config/env';

export async function uploadImage(uri, folder = 'uberclone') {
  const file = new File(uri);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', ENV.cloudinaryUploadPreset);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${ENV.cloudinaryCloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message || `Cloudinary upload failed with status ${response.status}`
    );
  }

  return data.secure_url;
}