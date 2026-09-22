import { Module } from '@nestjs/common';
import { QprsController } from './qprs.controller';
import { QprsService } from './qprs.service';
import { SscController } from './ssc.controller';
import { SscService } from './ssc.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { PdfModule } from '../../infrastructure/pdf/pdf.module';

import { DailyReminderService } from './daily-reminder.service';

@Module({
  imports: [PrismaModule, MailModule, PdfModule],
  controllers: [QprsController, SscController],
  providers: [QprsService, SscService, DailyReminderService],
  exports: [QprsService, SscService, DailyReminderService],
})
export class QprsModule {}
