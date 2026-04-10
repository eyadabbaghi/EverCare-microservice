import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KeycloakAdminService } from './keycloak-admin.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [KeycloakAdminService],
  exports: [KeycloakAdminService],
})
export class KeycloakModule {}
