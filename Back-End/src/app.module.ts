import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PartsModule } from './parts/parts.module';
import { VendorsModule } from './vendors/vendors.module';
import { NcrsModule } from './ncrs/ncrs.module';

@Module({
  imports: [UsersModule, PartsModule, VendorsModule, NcrsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
