"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MinioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const Minio = require("minio");
let MinioService = MinioService_1 = class MinioService {
    constructor() {
        this.logger = new common_1.Logger(MinioService_1.name);
    }
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
            }
            else {
                this.logger.log(`Bucket "${this.bucketName}" already exists.`);
            }
        }
        catch (error) {
            this.logger.error('Warning: Failed to connect to MinIO. File upload functionality will not work until MinIO container is running.');
            this.logger.error(error.message);
        }
    }
    async uploadBuffer(buffer, objectName, contentType) {
        try {
            await this.minioClient.putObject(this.bucketName, objectName, buffer, buffer.length, { 'Content-Type': contentType });
            this.logger.log(`Successfully uploaded file to MinIO: ${objectName}`);
            return objectName;
        }
        catch (error) {
            this.logger.error(`Failed to upload object "${objectName}" to MinIO: ${error.message}`);
            throw error;
        }
    }
    async getPresignedUrl(objectName, expirySeconds = 86400) {
        try {
            const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, expirySeconds);
            return url;
        }
        catch (error) {
            this.logger.error(`Failed to generate presigned URL for "${objectName}": ${error.message}`);
            throw error;
        }
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = MinioService_1 = __decorate([
    (0, common_1.Injectable)()
], MinioService);
//# sourceMappingURL=minio.service.js.map