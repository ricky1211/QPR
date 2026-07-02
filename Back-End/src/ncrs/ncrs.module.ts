import { Module } from '@nestjs/common';
import { NcrsService } from './ncrs.service';
import { NcrsController } from './ncrs.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [NcrsController],
  providers: [NcrsService, PrismaService],
  exports: [NcrsService],
})
export class NcrsModule {}
