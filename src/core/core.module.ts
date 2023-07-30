import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogModule } from 'src/log/log.module';
import { AuthModule } from 'src/auth/auth.module';
import { ThingController } from './thing/controller/thing.controller';
import { ThingService } from './thing/service/thing.service';
import { ThingMapper } from './thing/mapper/thing.mapper';
import { Thing } from './thing/entity/thing.entity';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { UserMapper } from './mapper/user.mapper';
import { User } from './entity/user.entity';
import { CompanyController } from './controller/company.controller';
import { CompanyService } from './service/company.service';
import { CompanyMapper } from './mapper/company.mapper';
import { Company } from './entity/company.entity';
import { AccountController } from './controller/account.controller';
import { AccountService } from './service/account.service';
import { AccountMapper } from './mapper/account.mapper';
import { Account } from './entity/account.entity';
import { TransactionService } from './service/transaction.service';
import { Transaction } from './entity/transaction.entity';
import { TransactionLine } from './entity/transaction-line.entity';

/**
 * Contains the core services and entities of the app
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Thing,
      User,
      Company,
      Account,
      Transaction,
      TransactionLine
    ]),
    LogModule,
    AuthModule
  ],
  controllers: [
    ThingController,
    UserController,
    CompanyController,
    AccountController
  ],
  providers: [
    ThingService,
    ThingMapper,
    UserService,
    UserMapper,
    CompanyService,
    CompanyMapper,
    AccountService,
    AccountMapper,
    TransactionService
  ]
})
export class CoreModule {}
