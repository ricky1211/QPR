import { Controller, Post, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('sync/vendors')
  @HttpCode(200)
  async syncVendors() {
    return this.webhooksService.syncVendors();
  }

  @Post('sync/parts')
  @HttpCode(200)
  async syncParts() {
    return this.webhooksService.syncParts();
  }

  @Post('sync/all')
  @HttpCode(200)
  async syncAll() {
    return this.webhooksService.syncAll();
  }

  @Post('sync')
  @HttpCode(200)
  async triggerSync() {
    return this.webhooksService.syncAll();
  }
}
