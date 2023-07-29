import { PartialType, PickType } from '@nestjs/mapped-types';
import { Company } from '../entity/company.entity';

/**
 * Contains updated attributes for an existing company
 */
export class CompanyUpdateDto extends PartialType(
  class CompanyUpdate extends PickType(Company, ['name'] as const) {}
) {}
