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
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
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
            select: {
                id: true,
                code: true,
                date: true,
                partId: true,
                vendorId: true,
                description: true,
                isRequiredCustomerApproval: true,
                customerApproval: true,
                part: {
                    select: {
                        id: true,
                        partNumber: true,
                        partDesc: true,
                    }
                },
                vendor: {
                    select: {
                        id: true,
                        vendorCode: true,
                        vendorName: true,
                    }
                },
                ncrApprovalProgress: {
                    select: {
                        id: true,
                        ncrId: true,
                        checksumApprovalSectionHead: true,
                        checksumApprovalDeptHead: true,
                    }
                }
            }
        });
    }
    async createNcr(data) {
        let vendor = await this.prisma.vendor.findFirst({
            where: {
                OR: [
                    { id: data.vendorId },
                    { vendorCode: data.vendorId },
                    { vendorCode: data.vendorCode }
                ]
            }
        });
        if (!vendor) {
            const code = data.vendorCode || data.vendorId || `VND-${Math.floor(1000 + Math.random() * 9000)}`;
            vendor = await this.prisma.vendor.create({
                data: {
                    vendorCode: code,
                    vendorName: data.vendorName || `Vendor ${code}`,
                }
            });
        }
        let primaryPartId = data.partId || null;
        if (data.partsDetail && Array.isArray(data.partsDetail)) {
            for (const item of data.partsDetail) {
                const partNumber = item.partNumber;
                const partDesc = item.partName;
                if (partNumber) {
                    const part = await this.prisma.part.upsert({
                        where: { partNumber },
                        update: { partDesc: partDesc || undefined },
                        create: {
                            partNumber,
                            partDesc: partDesc || null,
                        }
                    });
                    if (!primaryPartId) {
                        primaryPartId = part.id;
                    }
                    await this.prisma.vendorPart.upsert({
                        where: {
                            vendorId_partId: {
                                vendorId: vendor.id,
                                partId: part.id,
                            }
                        },
                        update: {},
                        create: {
                            vendorId: vendor.id,
                            partId: part.id,
                        }
                    });
                }
            }
        }
        const inspectorConnect = data.inspectorIds && Array.isArray(data.inspectorIds)
            ? { connect: data.inspectorIds.map((id) => ({ id })) }
            : undefined;
        const ncrDate = data.date ? new Date(data.date) : new Date();
        const startOfDay = new Date(ncrDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(ncrDate);
        endOfDay.setHours(23, 59, 59, 999);
        const dailyNcrCount = await this.prisma.ncr.count({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
        const nextSeq = String(dailyNcrCount + 1).padStart(4, '0');
        const dd = String(ncrDate.getDate()).padStart(2, '0');
        const mm = String(ncrDate.getMonth() + 1).padStart(2, '0');
        const yy = String(ncrDate.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const supplierCode = vendor.vendorCode || 'VND';
        const autoNcrCode = `${nextSeq}/${dateStr}/${supplierCode}`;
        return this.prisma.ncr.create({
            data: {
                code: autoNcrCode,
                date: ncrDate,
                vendor: { connect: { id: vendor.id } },
                part: primaryPartId ? { connect: { id: primaryPartId } } : undefined,
                location: data.location || null,
                problemType: data.problemType || null,
                disposition: data.disposition || null,
                description: data.description || null,
                isRequiredCustomerApproval: data.isRequiredCustomerApproval ?? null,
                customerApproval: data.customerApproval || null,
                docsToRevise: data.docsToRevise || null,
                images: data.images || null,
                details: data.details || null,
                inspectors: inspectorConnect,
            }
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