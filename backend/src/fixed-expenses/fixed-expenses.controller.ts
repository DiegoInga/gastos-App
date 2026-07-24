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
import { FixedExpensesService } from './fixed-expenses.service';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@ApiTags('Gastos Fijos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('fixed-expenses')
export class FixedExpensesController {
  constructor(private readonly fixedExpensesService: FixedExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos fijos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de gastos fijos.' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.fixedExpensesService.findAllByUser(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo gasto fijo' })
  @ApiResponse({ status: 201, description: 'El gasto fijo ha sido creado exitosamente.' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createDto: CreateFixedExpenseDto,
  ) {
    return this.fixedExpensesService.create(user.userId, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un gasto fijo existente' })
  @ApiResponse({ status: 200, description: 'Gasto fijo actualizado.' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateDto: UpdateFixedExpenseDto,
  ) {
    return this.fixedExpensesService.update(user.userId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un gasto fijo' })
  @ApiResponse({ status: 204, description: 'Gasto fijo eliminado exitosamente.' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.fixedExpensesService.remove(user.userId, id);
  }
}
