import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PartsService } from './parts.service';
import { Part } from '@prisma/client';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  async getAllParts(): Promise<Part[]> {
    return this.partsService.findAll();
  }

  @Get(':id')
  async getPartById(@Param('id') id: string): Promise<Part | null> {
    return this.partsService.findOne(id);
  }

  @Post()
  async createPart(
    @Body() data: {
      partNumber: string;
      partDesc?: string;
      allowanceRatio?: number | null;
      status?: string;
      supplierId?: string;
    }
  ): Promise<Part> {
    return this.partsService.createPart({
      partNumber: data.partNumber,
      partDesc: data.partDesc,
      allowanceRatio: data.allowanceRatio !== undefined && data.allowanceRatio !== null ? Number(data.allowanceRatio) : null,
      status: data.status || 'Aktif',
      vendorParts: data.supplierId ? {
        create: {
          vendorId: data.supplierId
        }
      } : undefined
    });
  }

  @Put(':id')
  async updatePart(
    @Param('id') id: string,
    @Body() data: {
      partNumber?: string;
      partDesc?: string;
      allowanceRatio?: number | null;
      status?: string;
      supplierId?: string;
    },
  ): Promise<Part> {
    return this.partsService.updatePart(id, {
      partNumber: data.partNumber,
      partDesc: data.partDesc,
      allowanceRatio: data.allowanceRatio !== undefined ? (data.allowanceRatio === null ? null : Number(data.allowanceRatio)) : undefined,
      status: data.status,
      vendorParts: data.supplierId ? {
        deleteMany: {},
        create: {
          vendorId: data.supplierId
        }
      } : undefined
    });
  }
}
