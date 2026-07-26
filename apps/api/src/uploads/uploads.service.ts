import { Readable } from "node:stream";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export interface UploadedImage {
  url: string;
  publicId: string;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>("cloudinary.cloudName"),
      api_key: this.configService.getOrThrow<string>("cloudinary.apiKey"),
      api_secret: this.configService.getOrThrow<string>("cloudinary.apiSecret"),
    });
  }

  async uploadImage(file: Express.Multer.File, folder = "hussain-perfumes/products"): Promise<UploadedImage> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploadResult);
      });
      Readable.from(file.buffer).pipe(uploadStream);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
