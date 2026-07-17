import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  async onModuleInit() {
    const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ROOT_USER || 'minioadmin';
    const secretKey = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'qpr-uploads';

    try {
      this.minioClient = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });

      this.logger.log(`Connecting to MinIO at ${endPoint}:${port}...`);
      
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        this.logger.log(`Bucket "${this.bucketName}" does not exist. Creating bucket...`);
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Set public read policy for objects in the bucket
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket "${this.bucketName}" created successfully and set read-only policy.`);
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists.`);
      }
    } catch (error) {
      this.logger.error('Warning: Failed to connect to MinIO. File upload functionality will not work until MinIO container is running.');
      this.logger.error(error.message);
    }
  }

  /**
   * Uploads a file buffer to MinIO
   * @param buffer File buffer to upload
   * @param objectName Destination path inside bucket (e.g. 'ncr-uploads/filename.png')
   * @param contentType MIME type of the file
   * @returns Relative path/objectName of the uploaded file
   */
  async uploadBuffer(buffer: Buffer, objectName: string, contentType: string): Promise<string> {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        buffer,
        buffer.length,
        { 'Content-Type': contentType }
      );
      this.logger.log(`Successfully uploaded file to MinIO: ${objectName}`);
      return objectName;
    } catch (error) {
      this.logger.error(`Failed to upload object "${objectName}" to MinIO: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates a temporary presigned URL for reading an object
   * @param objectName Object path in bucket
   * @param expirySeconds Expiration duration in seconds (default: 24 hours / 86400 seconds)
   */
  async getPresignedUrl(objectName: string, expirySeconds = 86400): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, expirySeconds);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for "${objectName}": ${error.message}`);
      throw error;
    }
  }
}
