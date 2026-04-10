import { SetMetadata } from '@nestjs/common';

export const CrossOrigin = (origins: string = '*') =>
  SetMetadata('cross-origin', origins);
