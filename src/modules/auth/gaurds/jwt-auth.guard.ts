import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers?.authorization;
    const bearerMatch =
      typeof authHeader === 'string'
        ? authHeader.match(/^Bearer\s+(.+)$/i)
        : null;
    const token = bearerMatch?.[1] ?? '';
    const hasBearer = Boolean(token);
    const tokenPreview =
      hasBearer && token.length >= 10 ? `${token.slice(0, 10)}...` : 'n/a';

    this.logger.debug(
      `[${request.method}] ${request.originalUrl ?? request.url} -> auth header present: ${Boolean(authHeader)}, bearer format: ${hasBearer}, token preview: ${tokenPreview}`,
    );

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: { message?: string; name?: string } | string | undefined,
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    const infoMessage =
      typeof info === 'string' ? info : (info?.message ?? info?.name);

    if (err || !user) {
      this.logger.warn(
        `[${request.method}] ${request.originalUrl ?? request.url} -> auth failed. reason: ${infoMessage ?? 'unknown'}`,
      );
      throw err instanceof Error
        ? err
        : new UnauthorizedException(infoMessage || 'Unauthorized');
    }

    this.logger.debug(
      `[${request.method}] ${request.originalUrl ?? request.url} -> auth success`,
    );
    return user;
  }
}
