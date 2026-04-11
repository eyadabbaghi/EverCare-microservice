import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig: MongooseModuleOptions = {
  autoIndex: true,
  autoCreate: true,
};
