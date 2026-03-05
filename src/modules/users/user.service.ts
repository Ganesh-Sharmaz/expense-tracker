import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Check username uniqueness before attempting insert
    const existingUsername = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Check email uniqueness if provided
    if (dto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    const user = this.userRepository.create(dto);
    return this.userRepository.save(user); // @BeforeInsert hashes password
  }

  // Used by auth strategy — includes password for comparison
  findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  // Used by JWT strategy to rehydrate user from token payload
  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Safe profile fetch — password excluded via @Exclude on entity
  async getProfile(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
