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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NcrsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let NcrsService = class NcrsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(id) {
        return this.prisma.ncr.findUnique({
            where: { id },
            include: {
                ncrApprovalProgress: true,
                part: true,
                vendor: true,
                inspectors: true,
            },
        });
    }
    async findByCode(code) {
        return this.prisma.ncr.findUnique({
            where: { code },
        });
    }
    async findAll() {
        return this.prisma.ncr.findMany({
            include: {
                ncrApprovalProgress: true,
                part: true,
                vendor: true,
                inspectors: true,
            },
        });
    }
    async createNcr(data) {
        return this.prisma.ncr.create({
            data,
        });
    }
    async updateNcr(id, data) {
        return this.prisma.ncr.update({
            where: { id },
            data,
        });
    }
    async upsertApprovalProgress(ncrId, data) {
        const existing = await this.prisma.ncrApprovalProgress.findUnique({
            where: { ncrId },
        });
        if (existing) {
            return this.prisma.ncrApprovalProgress.update({
                where: { ncrId },
                data: {
                    checksumApprovalSectionHead: data.checksumApprovalSectionHead,
                    checksumApprovalDeptHead: data.checksumApprovalDeptHead,
                },
            });
        }
        else {
            return this.prisma.ncrApprovalProgress.create({
                data: {
                    ncrId,
                    checksumApprovalSectionHead: data.checksumApprovalSectionHead,
                    checksumApprovalDeptHead: data.checksumApprovalDeptHead,
                },
            });
        }
    }
};
exports.NcrsService = NcrsService;
exports.NcrsService = NcrsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NcrsService);
//# sourceMappingURL=ncrs.service.js.map