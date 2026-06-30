import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): { status: string; service: string } {
    return this.appService.getStatus();
  }
}
