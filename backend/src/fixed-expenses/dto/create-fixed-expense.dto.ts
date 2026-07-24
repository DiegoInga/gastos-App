import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, IsBoolean } from 'class-validator';

export class CreateFixedExpenseDto {
  @ApiProperty({ example: 'Plan Entel' })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 15990 })
  @IsNumber()
  @Min(0.01)
  monto!: number;

  @ApiPropertyOptional({ 
    enum: ['servicios', 'suscripciones', 'transporte', 'alimentacion', 'vivienda', 'personal', 'otro'], 
    example: 'servicios',
    default: 'otro'
  })
  @IsOptional()
  @IsEnum(['servicios', 'suscripciones', 'transporte', 'alimentacion', 'vivienda', 'personal', 'otro'])
  categoria?: 'servicios' | 'suscripciones' | 'transporte' | 'alimentacion' | 'vivienda' | 'personal' | 'otro';

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
