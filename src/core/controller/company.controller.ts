import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/access-token.guard';
import { LogService } from 'src/log/log.service';
import { CompanyService } from '../service/company.service';
import { CompanyMapper } from '../mapper/company.mapper';
import { CompanyDto } from '../dto/company.dto';
import { CompanyCreateDto } from '../dto/company-create.dto';
import { CompanyUpdateDto } from '../dto/company-update.dto';
import { AuthRequest } from 'src/auth/auth-request.dto';

/**
 * Handles requests for company entities
 */
@UseGuards(AccessTokenGuard)
@Controller('/api/companies')
export class CompanyController {
  constructor(
    private readonly SVC: CompanyService,
    private readonly MAP: CompanyMapper,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(CompanyController.name);
  }

  /**
   * Creates a new company
   *
   * @param req An authorized HTTP request
   * @param dto A company-create DTO
   * @returns A company DTO
   */
  @Post()
  async createOne(
    @Req() req: AuthRequest,
    @Body() dto: CompanyCreateDto
  ): Promise<CompanyDto> {
    this.LOGGER.log(`Create company=${JSON.stringify(dto)}.`);

    let company = await this.MAP.createToCompany(req.user.sub, dto);
    company = await this.SVC.create(company);

    return this.MAP.companyToDto(company);
  }

  /**
   * Gets all companies created by the identified user
   *
   * @param req An authorized HTTP request
   * @returns A list of company DTOs
   */
  @Get()
  async getAllByCreatorId(@Req() req: AuthRequest): Promise<CompanyDto[]> {
    this.LOGGER.log('Get all companies.');
    const companies = await this.SVC.findAllByCreatorId(req.user.sub);
    return companies?.map((company) => this.MAP.companyToDto(company));
  }

  /**
   * Gets the identified company
   *
   * @param id A company id
   * @returns A company DTO
   */
  @Get('/:id')
  async getOne(@Param('id') id: string): Promise<CompanyDto> {
    this.LOGGER.log(`Get company with id=${id}.`);
    const company = await this.SVC.findOneById(id);

    if (!company) throw new NotFoundException('Company does not exist.');

    return this.MAP.companyToDto(company);
  }

  /**
   * Updates the identified company
   *
   * @param req An authorized HTTP request
   * @param id A company id
   * @param updates A company-update DTO
   */
  @Patch('/:id')
  async updateOne(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updates: CompanyUpdateDto
  ): Promise<void> {
    this.LOGGER.log(
      `Update company with id=${id}, updates=${JSON.stringify(updates)}.`
    );
    const company = await this.MAP.updateToCompany(req.user.sub, updates);
    await this.SVC.update(id, company);
  }

  /**
   * Deletes the identified company
   *
   * @param id A company id
   */
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    this.LOGGER.log(`Delete company with id=${id}.`);
    await this.SVC.delete(id);
  }
}
