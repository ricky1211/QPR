import { Module } from '@nestjs/common';
import { QprsController } from './qprs.controller';
import { QprsService } from './qprs.service';
import { SscController } from './ssc.controller';
import { SscService } from './ssc.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QprsController, SscController],
  providers: [QprsService, SscService],
  exports: [QprsService, SscService],
})
export class QprsModule {}
