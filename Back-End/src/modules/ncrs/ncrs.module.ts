import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { NcrsService } from './ncrs.service';
import { NcrsController } from './ncrs.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { MinioModule } from '../../infrastructure/minio/minio.module';

@Module({
  imports: [
    PrismaModule,
    MinioModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // limit to 5MB
      },
    }),
  ],
  controllers: [NcrsController],
  providers: [NcrsService],
  exports: [NcrsService],
})
export class NcrsModule {}
