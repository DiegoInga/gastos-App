import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { fixedExpenses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';

@Injectable()
export class FixedExpensesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findAllByUser(userId: string) {
    return this.db.query.fixedExpenses.findMany({
      where: eq(fixedExpenses.user_id, userId),
      orderBy: (fe, { desc }) => [desc(fe.created_at)],
    });
  }

  async create(userId: string, createDto: CreateFixedExpenseDto) {
    const [newExpense] = await this.db
      .insert(fixedExpenses)
      .values({
        user_id: userId,
        nombre: createDto.nombre,
        monto: createDto.monto,
        categoria: createDto.categoria || 'otro',
        activo: createDto.activo !== undefined ? createDto.activo : true,
      })
      .returning();

    return newExpense;
  }

  async update(userId: string, id: string, updateDto: UpdateFixedExpenseDto) {
    // Verificar si existe y pertenece al usuario
    const expense = await this.db.query.fixedExpenses.findFirst({
      where: and(eq(fixedExpenses.id, id), eq(fixedExpenses.user_id, userId)),
    });

    if (!expense) {
      throw new NotFoundException('Gasto fijo no encontrado');
    }

    const updateData: any = {};
    if (updateDto.nombre !== undefined) updateData.nombre = updateDto.nombre;
    if (updateDto.monto !== undefined) updateData.monto = updateDto.monto;
    if (updateDto.categoria !== undefined) updateData.categoria = updateDto.categoria;
    if (updateDto.activo !== undefined) updateData.activo = updateDto.activo;

    const [updatedExpense] = await this.db
      .update(fixedExpenses)
      .set(updateData)
      .where(eq(fixedExpenses.id, id))
      .returning();

    return updatedExpense;
  }

  async remove(userId: string, id: string) {
    const result = await this.db
      .delete(fixedExpenses)
      .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.user_id, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Gasto fijo no encontrado');
    }

    return true;
  }
}
