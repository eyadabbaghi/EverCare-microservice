import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getEurekaConfig } from '../config/eureka.config';

const Eureka = require('eureka-js-client').Eureka;

@Injectable()
export class EurekaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EurekaService.name);
  private client: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const eurekaEnabled = this.configService.get<boolean>('eureka.enabled');

    if (!eurekaEnabled) {
      this.logger.log('Eureka registration is disabled');
      return;
    }

    try {
      const eurekaConfig = getEurekaConfig();

      this.logger.log(
        `Connecting to Eureka server: ${eurekaConfig.eureka.host}:${eurekaConfig.eureka.port}`,
      );
      this.logger.log(`Service name: ${eurekaConfig.instance.app}`);
      this.logger.log(`Service port: ${eurekaConfig.instance.port.$}`);

      this.client = new Eureka(eurekaConfig);

      this.client.start((error: Error) => {
        if (error) {
          this.logger.error('Failed to register with Eureka', error.message);
        } else {
          this.logger.log('Successfully registered with Eureka');
          this.logger.log(
            `Eureka status page: http://${eurekaConfig.eureka.host}:${eurekaConfig.eureka.port}`,
          );
        }
      });
    } catch (error) {
      this.logger.error('Error registering with Eureka', error);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.stop((error: Error) => {
        if (error) {
          this.logger.error('Failed to deregister from Eureka', error.message);
        } else {
          this.logger.log('Successfully deregistered from Eureka');
        }
      });
    }
  }
}
