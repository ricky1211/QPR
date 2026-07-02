import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Ncr, NcrApprovalProgress, Prisma } from '@prisma/client';

@Injectable()
export class NcrsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<any> {
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

  async findByCode(code: string): Promise<Ncr | null> {
    return this.prisma.ncr.findUnique({
      where: { code },
    });
  }

  async findAll(): Promise<Ncr[]> {
    return this.prisma.ncr.findMany({
      include: {
        ncrApprovalProgress: true,
        part: true,
        vendor: true,
        inspectors: true,
      },
    });
  }

  async createNcr(data: Prisma.NcrCreateInput): Promise<Ncr> {
    return this.prisma.ncr.create({
      data,
    });
  }

  async updateNcr(id: string, data: Prisma.NcrUpdateInput): Promise<Ncr> {
    return this.prisma.ncr.update({
      where: { id },
      data,
    });
  }

  async upsertApprovalProgress(
    ncrId: string,
    data: {
      checksumApprovalSectionHead?: Buffer;
      checksumApprovalDeptHead?: Buffer;
    },
  ): Promise<NcrApprovalProgress> {
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
    } else {
      return this.prisma.ncrApprovalProgress.create({
        data: {
          ncrId,
          checksumApprovalSectionHead: data.checksumApprovalSectionHead,
          checksumApprovalDeptHead: data.checksumApprovalDeptHead,
        },
      });
    }
  }
}
