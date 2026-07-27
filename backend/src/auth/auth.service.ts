import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { users, passwordResetTokens } from '../db/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email.toLowerCase().trim()),
    });

    // Inmunidad a enumeración de usuarios: No revelar si el email existe o no
    if (user) {
      // Invalidate any previous unused tokens for this user
      await this.db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.user_id, user.id));

      // Generate cryptographically secure random token (256-bit)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.db.insert(passwordResetTokens).values({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: false,
      });

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

      await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
    }

    return {
      message: 'Si la cuenta existe, hemos enviado un enlace de recuperación a tu correo.',
    };
  }

  async verifyResetToken(dto: VerifyResetTokenDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const now = new Date();

    const record = await this.db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token_hash, tokenHash),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires_at, now),
      ),
    });

    if (!record) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const now = new Date();

    const record = await this.db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token_hash, tokenHash),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires_at, now),
      ),
    });

    if (!record) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(dto.password, salt);

    // Update user password
    await this.db
      .update(users)
      .set({ password_hash: passwordHash })
      .where(eq(users.id, record.user_id));

    // Mark current token as used
    await this.db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.user_id, record.user_id));

    return { message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' };
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}

