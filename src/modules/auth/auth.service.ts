import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UsersService } from '../users/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = this.generateToken(user.id, user.username);
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 3. Check active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 4. Return token + safe user object
    const token = this.generateToken(user.id, user.username);
    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
      access_token: token,
    };
  }

  private generateToken(userId: number, username: string): string {
    const payload: JwtPayload = { sub: userId, username };
    return this.jwtService.sign(payload);
  }
}
