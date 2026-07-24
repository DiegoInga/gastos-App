import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncomeService } from './income.service';
import { UpsertIncomeDto } from './dto/upsert-income.dto';

@ApiTags('Ingreso Mensual')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get(':yearMonth')
  @ApiOperation({ summary: 'Obtener el presupuesto o ingreso mensual registrado' })
  @ApiResponse({ status: 200, description: 'Monto de ingresos registrado.' })
  async getIncome(
    @CurrentUser() user: { userId: string },
    @Param('yearMonth') yearMonth: string,
  ) {
    const income = await this.incomeService.findByMonth(user.userId, yearMonth);
    return income ?? { mes: yearMonth, monto: 0 };
  }

  @Put(':yearMonth')
  @ApiOperation({ summary: 'Registrar o actualizar el presupuesto o ingreso mensual' })
  @ApiResponse({ status: 200, description: 'Monto de ingresos registrado o actualizado exitosamente.' })
  upsertIncome(
    @CurrentUser() user: { userId: string },
    @Param('yearMonth') yearMonth: string,
    @Body() dto: UpsertIncomeDto,
  ) {
    return this.incomeService.upsert(user.userId, yearMonth, dto.monto);
  }
}
