import { PickType } from '@nestjs/mapped-types';
import { Company } from '../entity/company.entity';

/**
 * Represents a customer and/or vendor entity
 */
export class CompanyDto extends PickType(Company, ['id', 'name'] as const) {}
