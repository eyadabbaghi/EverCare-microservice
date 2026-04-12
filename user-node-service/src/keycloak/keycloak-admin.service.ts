import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { RegisterRequestDto } from '../users/dto/register-request.dto';
import { ChangePasswordRequestDto } from '../users/dto/change-password-request';

// Interface for token response
interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
}

// Interface for Keycloak error response
interface KeycloakErrorResponse {
  errorMessage?: string;
  error_description?: string;
  error?: string;
}

// Interface for user representation
interface UserRepresentation {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  credentials: CredentialRepresentation[];
  requiredActions: string[];
  realmRoles?: string[];
}

// Interface for credential
interface CredentialRepresentation {
  type: string;
  value: string;
  temporary: boolean;
}

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private adminToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Log all environment variables on startup
    this.logger.debug('=== Keycloak Configuration ===');
    this.logger.debug(
      `Auth Server URL: ${this.configService.get('keycloak.authServerUrl')}`,
    );
    this.logger.debug(`Realm: ${this.configService.get('keycloak.realm')}`);
    this.logger.debug(
      `Client ID: ${this.configService.get('keycloak.clientId')}`,
    );
    this.logger.debug(
      `Client Secret: ${this.configService.get('keycloak.clientSecret') ? '***SET***' : 'NOT SET'}`,
    );
    this.logger.debug('=============================');
  }

  private async getAdminAccessToken(): Promise<string> {
    // Log configuration values
    const authServerUrl = this.configService.get<string>(
      'keycloak.authServerUrl',
    );
    const realm = this.configService.get<string>('keycloak.realm');
    const clientId = this.configService.get<string>('keycloak.clientId');
    const clientSecret = this.configService.get<string>(
      'keycloak.clientSecret',
    );

    this.logger.debug('Getting admin access token...');
    this.logger.debug(`Auth Server URL: ${authServerUrl}`);
    this.logger.debug(`Realm: ${realm}`);
    this.logger.debug(`Client ID: ${clientId}`);
    this.logger.debug(`Client Secret exists: ${!!clientSecret}`);

    if (!authServerUrl || !realm || !clientId || !clientSecret) {
      this.logger.error('Keycloak configuration is incomplete:');
      this.logger.error(`authServerUrl: ${authServerUrl}`);
      this.logger.error(`realm: ${realm}`);
      this.logger.error(`clientId: ${clientId}`);
      this.logger.error(`clientSecret exists: ${!!clientSecret}`);
      throw new HttpException(
        'Keycloak configuration is incomplete',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Return cached token if still valid
    if (this.adminToken && this.tokenExpiry > Date.now() + 60000) {
      return this.adminToken;
    }

    const tokenUrl = `${authServerUrl}/realms/${realm}/protocol/openid-connect/token`;
    this.logger.debug(`Token URL: ${tokenUrl}`);

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    try {
      const response: AxiosResponse<TokenResponse> = await firstValueFrom(
        this.httpService.post<TokenResponse>(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.logger.debug('Successfully obtained admin token');
      this.adminToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.adminToken;
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error('Failed to get Keycloak admin token:');
      this.logger.error(`Status: ${axiosError.response?.status}`);
      this.logger.error(`Data: ${JSON.stringify(axiosError.response?.data)}`);
      this.logger.error(`Message: ${axiosError.message}`);
      throw new HttpException(
        `Failed to authenticate with Keycloak: ${axiosError.response?.data?.error_description || axiosError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(request: RegisterRequestDto): Promise<string> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm) {
        throw new HttpException(
          'Keycloak configuration is incomplete',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const url = `${authServerUrl}/admin/realms/${realm}/users`;

      const nameParts = request.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userRepresentation: UserRepresentation = {
        username: request.email,
        email: request.email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: request.password,
            temporary: false,
          },
        ],
        requiredActions: [],
      };

      const response: AxiosResponse<void> = await firstValueFrom(
        this.httpService.post<void>(url, userRepresentation, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const location = response.headers.location as string;
      if (!location) {
        throw new Error('No location header in response');
      }

      const userId = location.substring(location.lastIndexOf('/') + 1);
      this.logger.log(`User created successfully in Keycloak: ${userId}`);

      // Wait longer for Keycloak to fully process user creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force set password again (ensures credentials are properly stored)
      await this.forceSetPassword(userId, request.password);

      // Update user to ensure all attributes are properly set (fixes "Account not fully set up")
      await this.updateUser(userId);

      // Assign role to user
      await this.assignRoleToUser(userId, request.role);

      // Final verification - make sure user is fully set up
      await this.finalizeUserSetup(userId);

      return userId;
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to create user in Keycloak',
        axiosError.response?.data || axiosError.message,
      );

      const errorMessage =
        axiosError.response?.data?.errorMessage ||
        axiosError.response?.data?.error_description ||
        'Failed to create user in Keycloak';

      throw new HttpException(
        errorMessage,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async assignRoleToUser(userId: string, role: string): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId || !role) {
        this.logger.warn('Missing parameters for role assignment');
        return;
      }

      // Get available roles
      const rolesUrl = `${authServerUrl}/admin/realms/${realm}/roles`;
      const rolesResponse = await firstValueFrom(
        this.httpService.get(rolesUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const availableRoles = rolesResponse.data as Array<{ name: string }>;
      const targetRole = availableRoles.find((r) => r.name === role);

      if (!targetRole) {
        this.logger.warn(`Role '${role}' not found in Keycloak. Skipping role assignment.`);
        return;
      }

      // Assign role to user
      const assignRoleUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}/role-mappings/realm`;
      await firstValueFrom(
        this.httpService.post(assignRoleUrl, [targetRole], {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Role '${role}' assigned to user ${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to assign role to user in Keycloak',
        axiosError.response?.data || axiosError.message,
      );
      // Don't throw - user was created successfully, role assignment is optional
    }
  }

  async updateUser(userId: string): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId) {
        return;
      }

      // Get current user to merge with updates
      const getUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}`;
      const getResponse = await firstValueFrom(
        this.httpService.get(getUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const currentUser = getResponse.data;

      // Update user with all required fields to mark as fully set up
      // Clear any required actions and ensure user is fully enabled
      const updateUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}`;
      await firstValueFrom(
        this.httpService.put(updateUrl, {
          ...currentUser,
          enabled: true,
          emailVerified: true,
          requiredActions: [],
          // Explicitly nullify any pending actions
          notBefore: 0,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      // Also delete any existing required action tokens
      const deleteActionsUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}/delete-required-actions`;
      try {
        await firstValueFrom(
          this.httpService.delete(deleteActionsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      } catch (e) {
        // Endpoint may not exist in all Keycloak versions - ignore error
        this.logger.debug('Delete required actions endpoint not available, skipping');
      }

      this.logger.log(`User ${userId} updated to fully set up`);
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to update user in Keycloak',
        axiosError.response?.data || axiosError.message,
      );
    }
  }

  async finalizeUserSetup(userId: string): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId) {
        return;
      }

      // Use the execute-actions-api to clear any pending required actions
      // This is a direct approach to mark account as fully set up
      const getUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}`;
      const getResponse = await firstValueFrom(
        this.httpService.get(getUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const user = getResponse.data;

      // Clear any attributes that might be causing issues
      // Set notBefore to 0 (disable caching of invalid credentials)
      if (user.notBefore === undefined || user.notBefore === null) {
        const notBeforeUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}/not-before`;
        await firstValueFrom(
          this.httpService.delete(notBeforeUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      }

      this.logger.log(`User ${userId} final setup completed`);
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to finalize user setup in Keycloak',
        axiosError.response?.data || axiosError.message,
      );
    }
  }

  async changePassword(
    userId: string,
    request: ChangePasswordRequestDto,
  ): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId) {
        throw new HttpException(
          'Keycloak configuration is incomplete',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const url = `${authServerUrl}/admin/realms/${realm}/users/${userId}/reset-password`;

      const credential: CredentialRepresentation = {
        type: 'password',
        value: request.newPassword,
        temporary: false,
      };

      await firstValueFrom(
        this.httpService.put(url, credential, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(
        `Password changed successfully for Keycloak user: ${userId}`,
      );
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to change password in Keycloak',
        axiosError.response?.data || axiosError.message,
      );
      throw new HttpException(
        'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forceSetPassword(userId: string, password: string): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId) {
        return;
      }

      // Delete existing credentials first
      const credentialsUrl = `${authServerUrl}/admin/realms/${realm}/users/${userId}/credentials`;
      try {
        await firstValueFrom(
          this.httpService.delete(credentialsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      } catch (e) {
        // May not have existing credentials - ignore
      }

      // Set new password
      const url = `${authServerUrl}/admin/realms/${realm}/users/${userId}/reset-password`;
      const credential: CredentialRepresentation = {
        type: 'password',
        value: password,
        temporary: false,
      };

      await firstValueFrom(
        this.httpService.put(url, credential, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Password forcefully set for user ${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to force set password in Keycloak',
        axiosError.response?.data || axiosError.message,
      );
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm || !userId) {
        throw new HttpException(
          'Keycloak configuration is incomplete',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const url = `${authServerUrl}/admin/realms/${realm}/users/${userId}`;

      await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      this.logger.log(`User deleted successfully from Keycloak: ${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to delete user from Keycloak',
        axiosError.response?.data || axiosError.message,
      );
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserBySessionId(
    sessionId: string,
  ): Promise<{ id: string; email: string; username: string } | null> {
    try {
      const token = await this.getAdminAccessToken();
      const authServerUrl = this.configService.get<string>(
        'keycloak.authServerUrl',
      );
      const realm = this.configService.get<string>('keycloak.realm');

      if (!authServerUrl || !realm) {
        throw new HttpException(
          'Keycloak configuration is incomplete',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Get user sessions from Keycloak Admin API
      const url = `${authServerUrl}/admin/realms/${realm}/sessions/${sessionId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const session = response.data;
      if (session && session.userId) {
        // Get user details
        const userUrl = `${authServerUrl}/admin/realms/${realm}/users/${session.userId}`;
        const userResponse = await firstValueFrom(
          this.httpService.get(userUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        const user = userResponse.data;
        return {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      this.logger.error(
        'Failed to get user by session from Keycloak',
        axiosError.response?.data || axiosError.message,
      );
      return null;
    }
  }

  async validateCredentials(email: string, password: string): Promise<{ access_token: string; expires_in: number }> {
    // Get admin token
    const adminToken = await this.getAdminAccessToken();
    const authServerUrl = this.configService.get<string>('keycloak.authServerUrl');
    const realm = this.configService.get<string>('keycloak.realm');

    if (!authServerUrl || !realm) {
      throw new HttpException('Keycloak configuration is incomplete', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Find user by email
    const usersUrl = `${authServerUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}`;
    const usersResponse = await firstValueFrom(
      this.httpService.get(usersUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    );

    const users = usersResponse.data as Array<{ id: string; email: string; enabled: boolean }>;
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (!user.enabled) {
      throw new HttpException('User account is disabled', HttpStatus.UNAUTHORIZED);
    }

    // Use Keycloak's token endpoint with password grant to validate credentials
    // First, get the client_id and client_secret from config
    const clientId = this.configService.get<string>('keycloak.clientId');
    const clientSecret = this.configService.get<string>('keycloak.clientSecret');

    const tokenUrl = `${authServerUrl}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', clientId || 'frontend-app');
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }
    params.append('username', email);
    params.append('password', password);

    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post<{ access_token: string; expires_in: number }>(tokenUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      return {
        access_token: tokenResponse.data.access_token,
        expires_in: tokenResponse.data.expires_in,
      };
    } catch (error) {
      const axiosError = error as AxiosError<KeycloakErrorResponse>;
      if (axiosError.response?.status === 400) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
