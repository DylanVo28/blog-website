import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'blog-website-backend',
      phase: 'phase-9',
      timestamp: new Date().toISOString(),
    };
  }
}
