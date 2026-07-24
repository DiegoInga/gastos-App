import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { debts, fixedExpenses } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async getStats(userId: string) {
    const userDebts = await this.db.query.debts.findMany({
      where: eq(debts.user_id, userId),
      with: {
        pagos: true,
      },
    });

    const userFixedExpenses = await this.db.query.fixedExpenses.findMany({
      where: and(eq(fixedExpenses.user_id, userId), eq(fixedExpenses.activo, true)),
    });

    const today = new Date().toISOString().split('T')[0];

    let totalDeudaRestante = 0;
    let totalPagado = 0;
    let totalGeneral = 0;
    let activeDebtsCount = 0;
    let overdueCount = 0;

    userDebts.forEach((debt) => {
      let debtRemaining = 0;
      let debtPaid = 0;

      debt.pagos.forEach((payment) => {
        if (payment.pagado) {
          debtPaid += payment.monto;
        } else {
          debtRemaining += payment.monto;
          if (payment.fecha < today) {
            overdueCount++;
          }
        }
      });

      totalDeudaRestante += debtRemaining;
      totalPagado += debtPaid;
      totalGeneral += debt.monto_total;

      if (debtRemaining > 0.01) {
        activeDebtsCount++;
      }
    });

    let totalGastosFijos = 0;
    userFixedExpenses.forEach(expense => {
      totalGastosFijos += expense.monto;
    });

    const progressGlobal = totalGeneral > 0 ? (totalPagado / totalGeneral) * 100 : 0;

    return {
      totalDeudaRestante: Math.round(totalDeudaRestante * 100) / 100,
      totalPagado: Math.round(totalPagado * 100) / 100,
      totalGeneral: Math.round(totalGeneral * 100) / 100,
      progressGlobal: Math.round(progressGlobal * 100) / 100,
      activeDebtsCount,
      overdueCount,
      totalGastosFijos: Math.round(totalGastosFijos * 100) / 100,
    };
  }
}
