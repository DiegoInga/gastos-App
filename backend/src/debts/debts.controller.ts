import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@ApiTags('Deudas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las deudas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de deudas con sus cronogramas de pago.' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.debtsService.findAllByUser(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva deuda y generar su cronograma de pagos' })
  @ApiResponse({ status: 201, description: 'La deuda ha sido creada exitosamente.' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createDebtDto: CreateDebtDto,
  ) {
    return this.debtsService.create(user.userId, createDebtDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar los parámetros de una deuda existente' })
  @ApiResponse({ status: 200, description: 'Deuda actualizada. Si cambiaron montos o cuotas, se recalcularon los pagos sin perder los estados ya pagados.' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ) {
    return this.debtsService.update(user.userId, id, updateDebtDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una deuda y todos sus pagos asociados' })
  @ApiResponse({ status: 204, description: 'Deuda eliminada exitosamente.' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.debtsService.remove(user.userId, id);
  }

  @Patch(':debtId/payments/:paymentId/toggle')
  @ApiOperation({ summary: 'Marcar o desmarcar una cuota específica como pagada' })
  @ApiResponse({ status: 200, description: 'Estado del pago modificado.' })
  togglePayment(
    @CurrentUser() user: { userId: string },
    @Param('debtId') debtId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.debtsService.togglePayment(user.userId, debtId, paymentId);
  }
}
