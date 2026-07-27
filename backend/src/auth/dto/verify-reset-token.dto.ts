import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetTokenDto {
  @ApiProperty({ description: 'Token de recuperación a verificar' })
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token!: string;
}
