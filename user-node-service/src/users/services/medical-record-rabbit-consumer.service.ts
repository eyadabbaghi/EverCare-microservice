import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from 'amqplib';
import { MedicalRecordEvent } from '../interfaces/medical-record-event.interface';
import { UserService } from './users.service';

@Injectable()
export class MedicalRecordRabbitConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MedicalRecordRabbitConsumerService.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private consumerTag?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit(): Promise<void> {
    const isEnabled =
      this.configService.get<boolean>('rabbitmq.enabled') ?? true;

    if (!isEnabled) {
      this.logger.warn('RabbitMQ medical-record consumer is disabled');
      return;
    }

    const rabbitUrl = this.configService.getOrThrow<string>('rabbitmq.url');
    const exchange = this.configService.getOrThrow<string>(
      'rabbitmq.medicalRecord.exchange',
    );
    const queue = this.configService.getOrThrow<string>(
      'rabbitmq.medicalRecord.queue',
    );
    const routingKey = this.configService.getOrThrow<string>(
      'rabbitmq.medicalRecord.routingKey',
    );

    try {
      const connection = await connect(rabbitUrl);
      const channel = await connection.createChannel();

      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, exchange, routingKey);
      await channel.prefetch(10);

      const consumed = await channel.consume(queue, (message) => {
        void this.consumeMessage(message);
      });

      this.connection = connection;
      this.channel = channel;
      this.consumerTag = consumed.consumerTag;
      this.logger.log(
        `RabbitMQ medical-record consumer connected on queue ${queue}`,
      );
    } catch (error) {
      this.logger.error(
        'Unable to connect RabbitMQ medical-record consumer',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
    }
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async consumeMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    try {
      const payload = JSON.parse(
        message.content.toString(),
      ) as MedicalRecordEvent;

      if (!payload?.eventType || !payload?.patientId || !payload?.recordId) {
        throw new Error('Medical record event payload is incomplete');
      }

      await this.userService.syncMedicalRecordProjection(payload);
      this.channel.ack(message);
    } catch (error) {
      this.logger.error(
        'Failed to process medical record RabbitMQ event',
        error instanceof Error ? error.stack : String(error),
      );
      this.channel.nack(message, false, false);
    }
  }
}
