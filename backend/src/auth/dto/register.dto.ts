import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'miPassword123' })
  @IsString()
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password!: string;

  @ApiProperty({ example: 'Diego' })
  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100)
  nombre!: string;
}
