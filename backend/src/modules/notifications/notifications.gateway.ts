import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: CurrentUserData;
  };
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const user = await this.authenticateClient(client);

    if (!user) {
      client.disconnect(true);
      return;
    }

    client.data.user = user;
    await client.join(this.getUserRoom(user.sub));
    this.logger.debug(`Socket connected for user ${user.sub}.`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.user?.sub;

    if (userId) {
      this.logger.debug(`Socket disconnected for user ${userId}.`);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
    ) {
      return authorizationHeader.slice(7).trim();
    }

    return null;
  }

  private async authenticateClient(
    client: Socket,
  ): Promise<CurrentUserData | null> {
    const token = this.extractToken(client);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        CurrentUserData & { iat?: number }
      >(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });

      const user = await this.usersRepository.findOne({
        where: {
          id: payload.sub,
        },
      });

      if (!user || user.bannedAt) {
        return null;
      }

      if (
        payload.iat &&
        user.passwordChangedAt &&
        Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat
      ) {
        return null;
      }

      return {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      this.logger.warn(
        `Socket authentication failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }
}
