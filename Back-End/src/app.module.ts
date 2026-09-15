import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { PartsModule } from './modules/parts/parts.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { NcrsModule } from './modules/ncrs/ncrs.module';
import { QprsModule } from './modules/qprs/qprs.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MinioModule } from './infrastructure/minio/minio.module';
import { MailModule } from './infrastructure/mail/mail.module';

@Module({
  imports: [UsersModule, PartsModule, VendorsModule, NcrsModule, QprsModule, WebhooksModule, MinioModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
