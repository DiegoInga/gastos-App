import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { DebtsModule } from './debts/debts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IncomeModule } from './income/income.module';
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    AuthModule,
    DebtsModule,
    DashboardModule,
    IncomeModule,
    FixedExpensesModule,
  ],
})
export class AppModule {}
