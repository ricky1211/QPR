"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NcrsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ncrs_service_1 = require("./ncrs.service");
const minio_service_1 = require("../../infrastructure/minio/minio.service");
let NcrsController = class NcrsController {
    constructor(ncrsService, minioService) {
        this.ncrsService = ncrsService;
        this.minioService = minioService;
    }
    async uploadFile(file) {
        const extension = file.originalname.split('.').pop() || 'jpg';
        const objectName = `ncr-uploads/ncr-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
        const relativePath = await this.minioService.uploadBuffer(file.buffer, objectName, file.mimetype);
        return { relativePath };
    }
    async getAllNcrs() {
        return this.ncrsService.findAll();
    }
    async getNcrById(id) {
        return this.ncrsService.findOne(id);
    }
    async createNcr(data) {
        return this.ncrsService.createNcr(data);
    }
    async updateNcr(id, data) {
        return this.ncrsService.updateNcr(id, data);
    }
    async updateApprovalProgress(id, data) {
        const secHeadBuffer = data.checksumApprovalSectionHead
            ? Buffer.from(data.checksumApprovalSectionHead, 'utf-8')
            : undefined;
        const deptHeadBuffer = data.checksumApprovalDeptHead
            ? Buffer.from(data.checksumApprovalDeptHead, 'utf-8')
            : undefined;
        return this.ncrsService.upsertApprovalProgress(id, {
            checksumApprovalSectionHead: secHeadBuffer,
            checksumApprovalDeptHead: deptHeadBuffer,
        });
    }
};
exports.NcrsController = NcrsController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "getAllNcrs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "getNcrById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "createNcr", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "updateNcr", null);
__decorate([
    (0, common_1.Post)(':id/approval-progress'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NcrsController.prototype, "updateApprovalProgress", null);
exports.NcrsController = NcrsController = __decorate([
    (0, common_1.Controller)('ncrs'),
    __metadata("design:paramtypes", [ncrs_service_1.NcrsService,
        minio_service_1.MinioService])
], NcrsController);
//# sourceMappingURL=ncrs.controller.js.map