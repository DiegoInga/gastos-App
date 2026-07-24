import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { users } from '../db/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(dto.password, salt);

    const [newUser] = await this.db.insert(users).values({
      email: dto.email,
      password_hash: passwordHash,
      nombre: dto.nombre,
    }).returning();

    const token = this.generateToken(newUser);
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      // Depending on schema id type, may need to cast to any or ensure it matches
      where: eq(users.id, userId as any),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: any = {};
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.password) {
      const salt = await bcryptjs.genSalt(10);
      updateData.password_hash = await bcryptjs.hash(dto.password, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return this.getProfile(userId);
    }

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    const { password_hash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
