import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpsertIncomeDto {
  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  monto!: number;
}
