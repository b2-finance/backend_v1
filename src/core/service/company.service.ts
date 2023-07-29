import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entity/company.entity';
import { LogService } from 'src/log/log.service';

/**
 * Provides services for manipulating company entities
 */
@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company) private readonly REPO: Repository<Company>,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(CompanyService.name);
  }

  /**
   * Creates a new company
   *
   * @param company A company
   * @returns The created company
   */
  async create(company: Company): Promise<Company> {
    return this.REPO.save(company);
  }

  /**
   * Finds all companies created by the identified user
   *
   * @param id A user id
   * @returns A list of companies
   */
  async findAllByCreatorId(id: string): Promise<Company[]> {
    return this.REPO.findBy({ createUser: { id } });
  }

  /**
   * Finds the identified company
   *
   * @param id A company id
   * @returns The identified company, or null if it does not exist
   */
  async findOneById(id: string): Promise<Company> {
    return this.REPO.findOneBy({ id });
  }

  /**
   * Updates the identified company
   *
   * @param id A company id
   * @param updates Updates to the company
   */
  async update(id: string, updates: Partial<Company>): Promise<void> {
    await this.REPO.update(id, updates);
  }

  /**
   * Deletes the identified company
   *
   * @param id A company id
   */
  async delete(id: string): Promise<void> {
    await this.REPO.delete(id);
  }
}
