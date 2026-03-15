// src/services/cloudinary.service.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'devlearn/images', resource_type: 'image', public_id: filename.replace(/\.[^.]+$/, '') },
      (err, result) => err ? reject(err) : resolve(result!.secure_url)
    );
    stream.end(buffer);
  });
}

export async function uploadVideo(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'devlearn/videos', resource_type: 'video', public_id: filename.replace(/\.[^.]+$/, '') },
      (err, result) => err ? reject(err) : resolve(result!.secure_url)
    );
    stream.end(buffer);
  });
}

export default cloudinary;
