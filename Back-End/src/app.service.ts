import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { status: string; service: string } {
    return {
      status: 'UP',
      service: 'PT Menara Terus Makmur QPR Back-End Service (NestJS)',
    };
  }
}
