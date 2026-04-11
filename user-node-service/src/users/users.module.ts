import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/users.service';
import { FileUploadService } from './services/file-upload.service';
import { MedicalRecordRabbitConsumerService } from './services/medical-record-rabbit-consumer.service';
import { UserController } from './controllers/users.controller';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
  ],
  controllers: [
    UserController,
    AdminController, // Add AdminController here
  ],
  providers: [
    UserRepository,
    UserService,
    FileUploadService,
    MedicalRecordRabbitConsumerService,
  ],

  exports: [UserService, UserRepository],
})
export class UsersModule {}
