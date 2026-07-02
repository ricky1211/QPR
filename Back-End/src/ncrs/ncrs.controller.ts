import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { NcrsService } from './ncrs.service';
import { Ncr, NcrApprovalProgress } from '@prisma/client';

@Controller('ncrs')
export class NcrsController {
  constructor(private readonly ncrsService: NcrsService) {}

  @Get()
  async getAllNcrs(): Promise<Ncr[]> {
    return this.ncrsService.findAll();
  }

  @Get(':id')
  async getNcrById(@Param('id') id: string): Promise<Ncr | null> {
    return this.ncrsService.findOne(id);
  }

  @Post()
  async createNcr(
    @Body()
    data: {
      code: string;
      partId: string;
      vendorId: string;
      location?: any;
      problemType?: any;
      description?: string;
      disposition?: any;
      isRequiredCustomerApproval?: boolean;
      details?: any;
      inspectorIds?: string[];
    },
  ): Promise<Ncr> {
    const inspectorConnect = data.inspectorIds
      ? { connect: data.inspectorIds.map((id) => ({ id })) }
      : undefined;

    return this.ncrsService.createNcr({
      code: data.code,
      part: { connect: { id: data.partId } },
      vendor: { connect: { id: data.vendorId } },
      location: data.location,
      problemType: data.problemType,
      description: data.description,
      disposition: data.disposition,
      isRequiredCustomerApproval: data.isRequiredCustomerApproval,
      details: data.details,
      inspectors: inspectorConnect,
    });
  }

  @Put(':id')
  async updateNcr(
    @Param('id') id: string,
    @Body()
    data: {
      location?: any;
      problemType?: any;
      description?: string;
      disposition?: any;
      isRequiredCustomerApproval?: boolean;
      details?: any;
    },
  ): Promise<Ncr> {
    return this.ncrsService.updateNcr(id, data);
  }

  @Post(':id/approval-progress')
  async updateApprovalProgress(
    @Param('id') id: string,
    @Body()
    data: {
      checksumApprovalSectionHead?: string;
      checksumApprovalDeptHead?: string;
    },
  ): Promise<NcrApprovalProgress> {
    const secHeadBuffer = data.checksumApprovalSectionHead
      ? Buffer.from(data.checksumApprovalSectionHead, 'utf-8')
      : undefined;
    const deptHeadBuffer = data.checksumApprovalDeptHead
      ? Buffer.from(data.checksumApprovalDeptHead, 'utf-8')
      : undefined;

    return this.ncrsService.upsertApprovalProgress(id, {
      checksumApprovalSectionHead: secHeadBuffer,
      checksumApprovalDeptHead: deptHeadBuffer,
    });
  }
}
