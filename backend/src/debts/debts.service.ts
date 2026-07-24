import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { debts, debtPayments } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findAllByUser(userId: string) {
    return this.db.query.debts.findMany({
      where: eq(debts.user_id, userId),
      with: {
        pagos: true,
      },
      orderBy: [desc(debts.created_at)],
    });
  }

  async create(userId: string, dto: CreateDebtDto) {
    const numCuotas = dto.tipo === 'directo' ? 1 : (dto.num_cuotas ?? 12);
    const cuotaMensual = Math.round((dto.monto_total / numCuotas) * 100) / 100;

    // 1. Insert Debt
    const [newDebt] = await this.db
      .insert(debts)
      .values({
        user_id: userId,
        nombre: dto.nombre,
        monto_total: dto.monto_total,
        cuota_mensual: cuotaMensual,
        num_cuotas: numCuotas,
        fecha_primera_cuota: dto.fecha_primera_cuota,
        tipo: dto.tipo,
      })
      .returning();

    // 2. Generate Payment Schedule
    const paymentsToInsert = this.generateScheduleList(
      newDebt.id,
      dto.monto_total,
      numCuotas,
      dto.fecha_primera_cuota,
    );

    // 3. Insert Payments
    const insertedPayments = await this.db
      .insert(debtPayments)
      .values(paymentsToInsert)
      .returning();

    return {
      ...newDebt,
      pagos: insertedPayments,
    };
  }

  async update(userId: string, debtId: string, dto: UpdateDebtDto) {
    // 1. Find existing debt and verify ownership
    const existingDebt = await this.db.query.debts.findFirst({
      where: and(eq(debts.id, debtId), eq(debts.user_id, userId)),
      with: {
        pagos: true,
      },
    });

    if (!existingDebt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    // 2. Determine if key schedule parameters changed
    const scheduleChanged =
      (dto.monto_total !== undefined && dto.monto_total !== existingDebt.monto_total) ||
      (dto.num_cuotas !== undefined && dto.num_cuotas !== existingDebt.num_cuotas) ||
      (dto.fecha_primera_cuota !== undefined && dto.fecha_primera_cuota !== existingDebt.fecha_primera_cuota) ||
      (dto.tipo !== undefined && dto.tipo !== existingDebt.tipo);

    const numCuotas = dto.tipo === 'directo' ? 1 : (dto.num_cuotas ?? existingDebt.num_cuotas);
    const montoTotal = dto.monto_total ?? existingDebt.monto_total;
    const cuotaMensual = Math.round((montoTotal / numCuotas) * 100) / 100;
    const fechaPrimeraCuota = dto.fecha_primera_cuota ?? existingDebt.fecha_primera_cuota;
    const tipo = dto.tipo ?? existingDebt.tipo;

    // 3. Update Debt
    const [updatedDebt] = await this.db
      .update(debts)
      .set({
        nombre: dto.nombre ?? existingDebt.nombre,
        monto_total: montoTotal,
        cuota_mensual: cuotaMensual,
        num_cuotas: numCuotas,
        fecha_primera_cuota: fechaPrimeraCuota,
        tipo,
      })
      .where(eq(debts.id, debtId))
      .returning();

    let finalPayments = existingDebt.pagos;

    // 4. Regenerate schedule if needed
    if (scheduleChanged) {
      // Generate new schedule
      const newPayments = this.generateScheduleList(
        debtId,
        montoTotal,
        numCuotas,
        fechaPrimeraCuota,
      );

      // Merge paid status from existing payments matching payment number
      const mergedPayments = newPayments.map((np) => {
        const matchingExist = existingDebt.pagos.find((ep) => ep.numero === np.numero);
        if (matchingExist) {
          return {
            ...np,
            pagado: matchingExist.pagado,
            fecha_pago: matchingExist.fecha_pago,
          };
        }
        return np;
      });

      // Clear old payments and insert merged new payments
      await this.db.delete(debtPayments).where(eq(debtPayments.debt_id, debtId));
      finalPayments = await this.db
        .insert(debtPayments)
        .values(mergedPayments)
        .returning();
    }

    return {
      ...updatedDebt,
      pagos: finalPayments,
    };
  }

  async remove(userId: string, debtId: string) {
    const existingDebt = await this.db.query.debts.findFirst({
      where: and(eq(debts.id, debtId), eq(debts.user_id, userId)),
    });

    if (!existingDebt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    await this.db.delete(debts).where(eq(debts.id, debtId));
    return { success: true };
  }

  async togglePayment(userId: string, debtId: string, paymentId: string) {
    // Verify debt ownership
    const existingDebt = await this.db.query.debts.findFirst({
      where: and(eq(debts.id, debtId), eq(debts.user_id, userId)),
    });

    if (!existingDebt) {
      throw new ForbiddenException('No tienes permiso para modificar esta deuda');
    }

    const payment = await this.db.query.debtPayments.findFirst({
      where: and(eq(debtPayments.id, paymentId), eq(debtPayments.debt_id, debtId)),
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const nextPagado = !payment.pagado;
    const nextFechaPago = nextPagado
      ? new Date().toISOString().split('T')[0]
      : null;

    const [updatedPayment] = await this.db
      .update(debtPayments)
      .set({
        pagado: nextPagado,
        fecha_pago: nextFechaPago,
      })
      .where(eq(debtPayments.id, paymentId))
      .returning();

    return updatedPayment;
  }

  // ── Helper schedule generation ─────────────────────────────────────
  private generateScheduleList(
    debtId: string,
    montoTotal: number,
    numCuotas: number,
    fechaPrimeraCuota: string,
  ) {
    const cuota = Math.round((montoTotal / numCuotas) * 100) / 100;
    const payments: any[] = [];

    const [year, month, day] = fechaPrimeraCuota.split('-').map(Number);

    for (let i = 0; i < numCuotas; i++) {
      const targetMonth = month - 1 + i;
      const d = new Date(year, targetMonth, day);

      // Handle month overflow
      if (d.getDate() !== day) {
        d.setDate(0);
      }

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      payments.push({
        debt_id: debtId,
        numero: i + 1,
        fecha: `${yyyy}-${mm}-${dd}`,
        monto: cuota,
        pagado: false,
      });
    }

    // Adjust last payment rounding
    if (payments.length > 0) {
      const totalSoFar = payments.reduce((s, p) => s + p.monto, 0);
      const diff = montoTotal - totalSoFar;
      if (Math.abs(diff) > 0.001) {
        payments[payments.length - 1].monto =
          Math.round((payments[payments.length - 1].monto + diff) * 100) / 100;
      }
    }

    return payments;
  }
}
