import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min, Max, IsInt } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'MacBook Pro 16' })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0.01)
  monto_total!: number;

  @ApiProperty({ enum: ['cuotas', 'directo'], example: 'cuotas' })
  @IsEnum(['cuotas', 'directo'])
  tipo!: 'cuotas' | 'directo';

  @ApiPropertyOptional({ example: 12, description: 'Número de cuotas (requerido si tipo=cuotas)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(360)
  num_cuotas?: number;

  @ApiProperty({ example: '2026-05-10' })
  @IsDateString()
  fecha_primera_cuota!: string;
}
