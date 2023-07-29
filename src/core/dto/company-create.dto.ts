import { PickType } from '@nestjs/mapped-types';
import { Company } from '../entity/company.entity';

/**
 * Contains required attributes for a new company
 */
export class CompanyCreateDto extends PickType(Company, ['name'] as const) {}
