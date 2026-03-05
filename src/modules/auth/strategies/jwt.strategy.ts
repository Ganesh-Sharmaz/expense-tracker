import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/users/user.service';

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>(
      'JWT_SECRET',
      'change_this_secret',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log(
      `JWT strategy initialized. JWT secret configured: ${Boolean(jwtSecret)} (length: ${jwtSecret.length})`,
    );
  }

  async validate(req: Request, payload: JwtPayload) {
    const authHeader = req.headers?.authorization;
    const hasBearer = Boolean(
      typeof authHeader === 'string' &&
      authHeader.match(/^Bearer\s+(.+)$/i)?.[1],
    );

    this.logger.debug(
      `Validating JWT for payload sub=${payload?.sub}. Bearer token present: ${hasBearer}`,
    );

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      this.logger.warn(
        `JWT payload sub=${payload?.sub} rejected: user missing or inactive`,
      );
      throw new UnauthorizedException('User not found or inactive');
    }

    this.logger.debug(`JWT validated successfully for userId=${user.id}`);
    return { id: user.id, username: user.username, name: user.name };
  }
}
