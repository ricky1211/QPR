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
  async createPart(@Body() data: { partNumber: string; partDesc?: string }): Promise<Part> {
    return this.partsService.createPart({
      partNumber: data.partNumber,
      partDesc: data.partDesc,
    });
  }

  @Put(':id')
  async updatePart(
    @Param('id') id: string,
    @Body() data: { partNumber?: string; partDesc?: string },
  ): Promise<Part> {
    return this.partsService.updatePart(id, data);
  }
}
