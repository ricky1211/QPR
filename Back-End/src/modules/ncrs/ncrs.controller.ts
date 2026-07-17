import { Controller, Get, Post, Put, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NcrsService } from './ncrs.service';
import { MinioService } from '../../infrastructure/minio/minio.service';
import { Ncr, NcrApprovalProgress } from '@prisma/client';

@Controller('ncrs')
export class NcrsController {
  constructor(
    private readonly ncrsService: NcrsService,
    private readonly minioService: MinioService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const extension = file.originalname.split('.').pop() || 'jpg';
    const objectName = `ncr-uploads/ncr-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    
    const relativePath = await this.minioService.uploadBuffer(
      file.buffer,
      objectName,
      file.mimetype,
    );
    
    return { relativePath };
  }

  @Get()
  async getAllNcrs(): Promise<any[]> {
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
      date?: string;
      partId?: string;
      vendorId: string;
      vendorCode?: string;
      vendorName?: string;
      location?: any;
      problemType?: any;
      description?: string;
      disposition?: any;
      isRequiredCustomerApproval?: boolean;
      customerApproval?: string;
      docsToRevise?: any;
      images?: any;
      details?: any;
      partsDetail?: Array<{
        partNumber: string;
        partName: string;
        qtyNG: number;
        ngType: string;
      }>;
      inspectorIds?: string[];
    },
  ): Promise<Ncr> {
    return this.ncrsService.createNcr(data);
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
