import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { QprsService } from './qprs.service';
import { Qpr, QprApprovalProgress } from '@prisma/client';

@Controller('qprs')
export class QprsController {
  constructor(private readonly qprsService: QprsService) {}

  @Get()
  async getAllQprs(): Promise<any[]> {
    return this.qprsService.findAll();
  }

  @Get(':id')
  async getQprById(@Param('id') id: string): Promise<any> {
    return this.qprsService.findOne(id);
  }

  @Post()
  async createQpr(
    @Body()
    data: {
      qprNumber: string;
      date?: string;
      vendorId: string;
      userId?: string;
      status?: any;
      requiredRole: string;
      refNcrNumber?: string;
      problem?: string;
      claimType?: string;
      totalQty: number;
      totalQtyNg: number;
      totalStdAllowance: number;
      billableQty: number;
      claimAmount?: number;
      qprParts?: Array<{
        partId: string;
        totalQty?: number;
        qtyNg?: number;
        stdAllowance?: number;
        qtyClaim?: number;
        unitPrice?: number;
        taxRate?: number;
      }>;
    },
  ): Promise<Qpr> {
    return this.qprsService.create(data);
  }

  @Put(':id')
  async updateQpr(
    @Param('id') id: string,
    @Body()
    data: {
      status?: any;
      requiredRole?: string;
      problem?: string;
      claimType?: string;
      totalQty?: number;
      totalQtyNg?: number;
      totalStdAllowance?: number;
      billableQty?: number;
      claimAmount?: number;
    },
  ): Promise<Qpr> {
    return this.qprsService.update(id, data);
  }

  @Post(':id/approval-progress')
  async updateApprovalProgress(
    @Param('id') qprId: string,
    @Body()
    data: {
      checksumSectionHead?: string;
      remarksSectionHead?: string;
      checksumDeptHead?: string;
      remarksDeptHead?: string;
      checksumDivHead?: string;
      remarksDivHead?: string;
      checksumVendor?: string;
      remarksVendor?: string;
    },
  ): Promise<QprApprovalProgress> {
    return this.qprsService.updateApprovalProgress(qprId, data);
  }

  @Get('confirmation-letters/all')
  async getAllConfirmationLetters(): Promise<any[]> {
    return this.qprsService.findAllConfirmationLetters();
  }

  @Post('confirmation-letters')
  async createConfirmationLetter(@Body() data: any): Promise<any> {
    return this.qprsService.createConfirmationLetter(data);
  }

  @Put('confirmation-letters/:id')
  async updateConfirmationLetter(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.qprsService.updateConfirmationLetter(id, data);
  }
}
