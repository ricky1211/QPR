import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Vendor } from '@prisma/client';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async getAllVendors(): Promise<Vendor[]> {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  async getVendorById(@Param('id') id: string): Promise<Vendor | null> {
    return this.vendorsService.findOne(id);
  }

  @Post()
  async createVendor(
    @Body() data: {
      vendorCode: string;
      vendorName?: string;
      email?: string;
      status?: string;
    }
  ): Promise<Vendor> {
    return this.vendorsService.createVendor({
      vendorCode: data.vendorCode,
      vendorName: data.vendorName,
      email: data.email,
      status: data.status || 'Aktif',
    });
  }

  @Put(':id')
  async updateVendor(
    @Param('id') id: string,
    @Body() data: {
      vendorCode?: string;
      vendorName?: string;
      email?: string;
      status?: string;
    }
  ): Promise<Vendor> {
    return this.vendorsService.updateVendor(id, {
      vendorCode: data.vendorCode,
      vendorName: data.vendorName,
      email: data.email,
      status: data.status,
    });
  }
}
