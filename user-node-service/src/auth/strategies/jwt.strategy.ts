import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/services/users.service';
import { UserRole } from '../../users/schemas/user-role.enum';
import * as jwksClient from 'jwks-rsa';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import { KeycloakAdminService } from '../../keycloak/keycloak-admin.service';

export interface JwtPayload {
  sub?: string;
  email?: string;
  preferred_username?: string;
  email_verified?: boolean;
  sid?: string;
  azp?: string;
  realm_access?: {
    roles: string[];
  };
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  keycloakId?: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly authServerUrl: string;
  private readonly realm: string;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private httpService: HttpService,
    private keycloakAdminService: KeycloakAdminService,
  ) {
    const authServerUrl = configService.get<string>('keycloak.authServerUrl');
    const realm = configService.get<string>('keycloak.realm');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: jwksClient.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authServerUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      passReqToCallback: true,
    });

    this.authServerUrl = authServerUrl || 'http://localhost:8090';
    this.realm = realm || 'EverCareRealm';
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    try {
      this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

      let email = payload.email || payload.preferred_username;
      let keycloakId = payload.sub;

      // If no email in token, try to get from Keycloak Admin API using session
      if (!email && payload.sid) {
        this.logger.debug(
          `No email in token, trying to get user from session: ${payload.sid}`,
        );

        try {
          // Get user info from Keycloak Admin API using session ID
          const userInfo = await this.keycloakAdminService.getUserBySessionId(
            payload.sid,
          );
          if (userInfo) {
            email = userInfo.email;
            keycloakId = userInfo.id;
            this.logger.debug(`Got user from Keycloak: ${email}`);
          }
        } catch (error) {
          this.logger.error(
            'Failed to get user from Keycloak Admin API:',
            error,
          );
        }
      }

      // If still no email, try to use sub
      if (!email && keycloakId) {
        this.logger.debug(
          `No email from UserInfo, using keycloakId: ${keycloakId}`,
        );

        // Try to find user by keycloakId first
        try {
          const userByKeycloakId =
            await this.userService.findByKeycloakId(keycloakId);
          if (userByKeycloakId) {
            this.logger.debug(
              `Found user by keycloakId: ${userByKeycloakId.email}`,
            );
            email = userByKeycloakId.email;
          }
        } catch {
          // User not found by keycloakId, will create new user
        }

        // If still no email, use keycloakId as email (this will trigger user creation)
        if (!email) {
          email = keycloakId;
        }
      }

      this.logger.debug(`Using email: ${email}`);

      if (!email) {
        throw new UnauthorizedException('No email in token');
      }

      // Try to find user, if not exists, create from Keycloak token
      let user;
      try {
        user = await this.userService.findByEmail(email);
      } catch (error) {
        // User doesn't exist, auto-create from Keycloak token
        this.logger.log(
          `User not found in MongoDB, creating from Keycloak token: ${email}`,
        );
        user = await this.userService.createFromKeycloak({
          sub: keycloakId,
          preferred_username: email,
          email: email,
        });
      }

      const roles = payload.realm_access?.roles || [];

      return {
        userId: user.userId,
        email: user.email,
        role: user.role,
        keycloakId: user.keycloakId,
        roles,
      };
    } catch (error) {
      this.logger.error('Token validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
