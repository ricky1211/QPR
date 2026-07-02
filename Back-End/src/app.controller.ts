import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getWelcome(): any {
    return this.appService.getWelcome();
  }

  @Get('api/status')
  getStatus(): { status: string; service: string } {
    return this.appService.getStatus();
  }
}
