import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('upload.path') ||
      'uploads/profile-pictures';
    this.baseUrl =
      this.configService.get<string>('upload.baseUrl') ||
      'http://localhost:8096';
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    const fullPath = path.join(process.cwd(), this.uploadPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      this.logger.log(`Created upload directory: ${fullPath}`);
    }
  }

  uploadProfilePicture(file: Express.Multer.File, userId: string): string {
    if (!file) {
      throw new HttpException('File is empty', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        'Only image files are allowed (jpeg, png, gif, webp)',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new HttpException(
        'File size cannot exceed 5MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(process.cwd(), this.uploadPath, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL (matches your Spring Boot URL pattern)
    const fileUrl = `${this.baseUrl}/EverCare/uploads/profile-pictures/${fileName}`;

    this.logger.log(`File uploaded successfully: ${fileName}`);
    return fileUrl;
  }

  deleteProfilePicture(fileUrl: string): void {
    if (!fileUrl) return;

    const fileName = fileUrl.split('/').pop();
    if (!fileName) return;

    const filePath = path.join(process.cwd(), this.uploadPath, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`File deleted successfully: ${fileName}`);
    }
  }
}
