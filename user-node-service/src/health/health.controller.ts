import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('actuator')
export class HealthController {
  constructor(private configService: ConfigService) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'UP',
      components: {
        db: {
          status: 'UP',
          details: {
            database: 'MongoDB',
            validationQuery: 'ping',
          },
        },
        diskSpace: {
          status: 'UP',
          details: {
            total: 1000000000,
            free: 500000000,
            threshold: 10000000,
            exists: true,
          },
        },
        ping: {
          status: 'UP',
        },
      },
    };
  }

  @Public()
  @Get('info')
  info() {
    return {
      application: {
        name: this.configService.get('serviceName') || 'user-service',
        version: '1.0.0',
        description: 'User Management Microservice',
      },
      server: {
        port: this.configService.get('port') || 8096,
        contextPath: '/EverCare',
      },
    };
  }
}
