import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ContentAgentInternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const configuredSecret = this.configService
      .get<string>('CONTENT_AGENT_INTERNAL_API_KEY')
      ?.trim();

    if (!configuredSecret) {
      throw new ServiceUnavailableException(
        'Content agent internal API key is not configured.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedSecret = this.extractSecret(request);

    if (!providedSecret) {
      throw new UnauthorizedException(
        'Missing content agent internal API key.',
      );
    }

    if (!this.isSecretMatch(providedSecret, configuredSecret)) {
      throw new UnauthorizedException(
        'Invalid content agent internal API key.',
      );
    }

    return true;
  }

  private extractSecret(request: Request) {
    const headerSecret = request.header('x-content-agent-secret')?.trim();
    if (headerSecret) {
      return headerSecret;
    }

    const authorization = request.header('authorization')?.trim();
    if (!authorization) {
      return null;
    }

    const [scheme, value] = authorization.split(/\s+/, 2);
    if (!scheme || !value) {
      return null;
    }

    if (scheme.toLowerCase() !== 'bearer') {
      return null;
    }

    return value.trim();
  }

  private isSecretMatch(provided: string, expected: string) {
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }
}
