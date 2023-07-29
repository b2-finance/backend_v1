import { Injectable } from '@nestjs/common';
import { Company } from '../entity/company.entity';
import { CompanyDto } from '../dto/company.dto';
import { CompanyCreateDto } from '../dto/company-create.dto';
import { CompanyUpdateDto } from '../dto/company-update.dto';
import { UserService } from '../service/user.service';

/**
 * Maps between company entities and DTOs
 */
@Injectable()
export class CompanyMapper {
  constructor(private readonly USER_SVC: UserService) {}
  /**
   * Converts a company entity to a company DTO
   *
   * @param company A company
   * @returns A company DTO
   */
  companyToDto(company: Company): CompanyDto {
    return {
      id: company.id,
      name: company.name
    };
  }

  /**
   * Converts a company-create DTO to a company
   *
   * @param userId The id of the user performing the transaction
   * @param dto A company-create DTO
   * @returns A company
   */
  async createToCompany(
    userId: string,
    dto: CompanyCreateDto
  ): Promise<Company> {
    const company = new Company();
    company.name = dto.name;

    const user = await this.USER_SVC.findOneById(userId);
    company.createUser = user;
    company.updateUser = user;

    return company;
  }

  /**
   * Converts a company-update DTO to a company
   *
   * @param userId The id of the user performing the transaction
   * @param dto A company-update DTO
   * @returns A company
   */
  async updateToCompany(
    userId: string,
    dto: CompanyUpdateDto
  ): Promise<Company> {
    const company = new Company();
    company.name = dto.name;
    company.updateUser = await this.USER_SVC.findOneById(userId);
    return company;
  }
}
