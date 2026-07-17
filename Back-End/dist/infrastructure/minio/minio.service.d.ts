import { OnModuleInit } from '@nestjs/common';
export declare class MinioService implements OnModuleInit {
    private readonly logger;
    private minioClient;
    private bucketName;
    onModuleInit(): Promise<void>;
    uploadBuffer(buffer: Buffer, objectName: string, contentType: string): Promise<string>;
    getPresignedUrl(objectName: string, expirySeconds?: number): Promise<string>;
}
