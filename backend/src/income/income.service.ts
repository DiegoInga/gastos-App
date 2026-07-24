import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../db/drizzle.module';
import { monthlyIncome } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class IncomeService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findByMonth(userId: string, yearMonth: string) {
    const record = await this.db.query.monthlyIncome.findFirst({
      where: and(
        eq(monthlyIncome.user_id, userId),
        eq(monthlyIncome.mes, yearMonth),
      ),
    });

    if (!record) return null;
    return {
      mes: record.mes,
      monto: record.monto,
    };
  }

  async upsert(userId: string, yearMonth: string, monto: number) {
    const [upserted] = await this.db
      .insert(monthlyIncome)
      .values({
        user_id: userId,
        mes: yearMonth,
        monto,
      })
      .onConflictDoUpdate({
        target: [monthlyIncome.user_id, monthlyIncome.mes],
        set: { monto },
      })
      .returning();

    return {
      mes: upserted.mes,
      monto: upserted.monto,
    };
  }
}
