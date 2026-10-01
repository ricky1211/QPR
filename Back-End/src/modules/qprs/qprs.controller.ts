import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { QprsService } from './qprs.service';
import { DailyReminderService } from './daily-reminder.service';
import { Qpr, QprApprovalProgress } from '@prisma/client';

@Controller('qprs')
export class QprsController {
  constructor(
    private readonly qprsService: QprsService,
    private readonly dailyReminderService: DailyReminderService,
  ) {}

  @Get()
  async getAllQprs(): Promise<any[]> {
    return this.qprsService.findAll();
  }

  @Get('confirmation-letters/all')
  async getAllConfirmationLetters(): Promise<any[]> {
    return this.qprsService.findAllConfirmationLetters();
  }

  @Post('confirmation-letters')
  async createConfirmationLetter(@Body() data: any): Promise<any> {
    return this.qprsService.createConfirmationLetter(data);
  }

  @Post('confirmation-letters/send-email')
  async sendConfirmationLetterEmail(@Body() data: any): Promise<any> {
    return this.qprsService.sendConfirmationLetterEmail(data);
  }

  @Put('confirmation-letters/:id')
  async updateConfirmationLetter(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.qprsService.updateConfirmationLetter(id, data);
  }

  @Post('daily-reminder/trigger')
  async triggerDailyReminder(
    @Body() body?: { targetEmail?: string },
  ): Promise<any> {
    return this.dailyReminderService.sendDailyReminderDigest(body?.targetEmail);
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
      qprNumber?: string;
      refNcrNumber?: string;
      pdfFileName?: string;
      pdfFileBase64?: string;
      status?: any;
      requiredRole?: string;
      problem?: string;
      claimType?: string;
      totalQty?: number;
      totalQtyNg?: number;
      totalStdAllowance?: number;
      billableQty?: number;
      claimAmount?: number;
      qprParts?: any[];
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
      checksumPurchasing?: string;
      remarksPurchasing?: string;
      checksumVendor?: string;
      remarksVendor?: string;
    },
  ): Promise<QprApprovalProgress> {
    return this.qprsService.updateApprovalProgress(qprId, data);
  }

  @Post(':id/send-reminder')
  async sendQprReminder(
    @Param('id') qprId: string,
    @Body() body?: { notes?: string },
  ): Promise<any> {
    return this.qprsService.sendQprReminder(qprId, body?.notes);
  }

  @Post('confirmation-letters/:id/send-reminder')
  async sendClReminder(
    @Param('id') clId: string,
    @Body() body?: { notes?: string },
  ): Promise<any> {
    return this.qprsService.sendClReminder(clId, body?.notes);
  }
}

