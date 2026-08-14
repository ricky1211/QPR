import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { SscService } from './ssc.service';
import { SscBilling, SscPayment } from '@prisma/client';

@Controller('ssc')
export class SscController {
  constructor(private readonly sscService: SscService) {}

  // ==================== SSC BILLING ====================

  @Get('billings')
  async getAllBillings(): Promise<SscBilling[]> {
    return this.sscService.findAllBillings();
  }

  @Get('billings/:id')
  async getBillingById(@Param('id') id: string): Promise<SscBilling | null> {
    return this.sscService.findBillingById(id);
  }

  @Post('billings')
  async createBilling(@Body() data: any): Promise<SscBilling> {
    return this.sscService.createBilling(data);
  }

  @Put('billings/:id')
  async updateBilling(@Param('id') id: string, @Body() data: any): Promise<SscBilling> {
    return this.sscService.updateBilling(id, data);
  }

  // ==================== SSC PAYMENT ====================

  @Get('payments')
  async getAllPayments(): Promise<SscPayment[]> {
    return this.sscService.findAllPayments();
  }

  @Get('payments/:id')
  async getPaymentById(@Param('id') id: string): Promise<SscPayment | null> {
    return this.sscService.findPaymentById(id);
  }

  @Post('payments')
  async createPayment(@Body() data: any): Promise<SscPayment> {
    return this.sscService.createPayment(data);
  }

  @Put('payments/:id')
  async updatePayment(@Param('id') id: string, @Body() data: any): Promise<SscPayment> {
    return this.sscService.updatePayment(id, data);
  }
}
