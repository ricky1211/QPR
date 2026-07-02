import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { status: string; service: string } {
    return {
      status: 'UP',
      service: 'PT Menara Terus Makmur QPR Back-End Service (NestJS)',
    };
  }

  getWelcome(): any {
    return {
      message: 'Welcome to MTM QPR Portal API',
      status: 'UP',
      service: 'PT Menara Terus Makmur QPR Back-End Service (NestJS)',
      endpoints: {
        status: '/api/status',
        users: '/users',
        parts: '/parts',
        vendors: '/vendors',
        ncrs: '/ncrs'
      }
    };
  }
}
