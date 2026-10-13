import { Injectable, UnauthorizedException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // Buat akun admin default jika tabel users masih kosong agar bisa langsung login ke dashboard
    const userCount = await this.userRepo.count();
    if (userCount === 0) {
      const defaultEmail = 'admin@iot.local';
      const defaultPass = 'admin123456';
      const hash = await bcrypt.hash(defaultPass, 10);
      const admin = this.userRepo.create({
        email: defaultEmail,
        password_hash: hash,
      });
      await this.userRepo.save(admin);
      console.log(`[AuthService] Seeded default admin account: ${defaultEmail} / ${defaultPass}`);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      password_hash: passwordHash,
    });
    await this.userRepo.save(user);

    const token = this.generateToken(user);
    return {
      access_token: token,
      user: { id: user.id, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const token = this.generateToken(user);
    return {
      access_token: token,
      user: { id: user.id, email: user.email },
    };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
