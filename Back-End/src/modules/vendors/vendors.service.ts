import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Vendor, Prisma } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({
      where: { id },
      include: {
        vendorParts: {
          include: {
            part: true,
          },
        },
      },
    });
  }

  async findByCode(vendorCode: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({
      where: { vendorCode },
    });
  }

  async findAll(): Promise<Vendor[]> {
    return this.prisma.vendor.findMany({
      include: {
        vendorParts: {
          include: {
            part: true,
          },
        },
      },
    });
  }

  async createVendor(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({
      data,
    });
  }
}
