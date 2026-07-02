import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Part, Prisma } from '@prisma/client';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<Part | null> {
    return this.prisma.part.findUnique({
      where: { id },
      include: { vendorParts: true },
    });
  }

  async findByPartNumber(partNumber: string): Promise<Part | null> {
    return this.prisma.part.findUnique({
      where: { partNumber },
    });
  }

  async findAll(): Promise<Part[]> {
    return this.prisma.part.findMany({
      include: { vendorParts: true },
    });
  }

  async createPart(data: Prisma.PartCreateInput): Promise<Part> {
    return this.prisma.part.create({
      data,
    });
  }

  async updatePart(id: string, data: Prisma.PartUpdateInput): Promise<Part> {
    return this.prisma.part.update({
      where: { id },
      data,
    });
  }
}
