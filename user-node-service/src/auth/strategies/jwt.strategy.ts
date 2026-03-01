import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/services/users.service';
import { UserRole } from '../../users/schemas/user-role.enum';
import * as jwksClient from 'jwks-rsa';

export interface JwtPayload {
  sub?: string;
  email?: string;
  preferred_username?: string;
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
  constructor(
    private configService: ConfigService,
    private userService: UserService,
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
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      const email = payload.email || payload.preferred_username;

      if (!email) {
        throw new UnauthorizedException('No email in token');
      }

      const user = await this.userService.findByEmail(email);
      const roles = payload.realm_access?.roles || [];

      return {
        userId: user.userId,
        email: user.email,
        role: user.role,
        keycloakId: user.keycloakId,
        roles,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
