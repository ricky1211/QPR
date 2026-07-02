import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PartsController],
  providers: [PartsService, PrismaService],
  exports: [PartsService],
})
export class PartsModule {}
