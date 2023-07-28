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
  UseGuards
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/access-token.guard';
import { LogService } from 'src/log/log.service';
import { ThingService } from '../service/thing.service';
import { ThingMapper } from '../mapper/thing.mapper';
import { ThingDto } from '../dto/thing.dto';
import { ThingCreateDto } from '../dto/thing-create.dto';
import { ThingUpdateDto } from '../dto/thing-update.dto';

/**
 * Handles requests for thing entities
 */
@UseGuards(AccessTokenGuard)
@Controller('/api/things')
export class ThingController {
  constructor(
    private readonly SVC: ThingService,
    private readonly MAP: ThingMapper,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(ThingController.name);
  }

  /**
   * Creates a new thing
   *
   * @param dto A thing-create DTO
   * @returns A thing DTO
   */
  @Post()
  async createOne(@Body() dto: ThingCreateDto): Promise<ThingDto> {
    this.LOGGER.log(`Create thing=${JSON.stringify(dto)}.`);

    let thing = this.MAP.createToThing(dto);
    thing = await this.SVC.create(thing);

    return this.MAP.thingToDto(thing);
  }

  /**
   * Gets all things
   *
   * @returns A list of thing DTOs
   */
  @Get()
  async getAll(): Promise<ThingDto[]> {
    this.LOGGER.log('Get all things.');
    const things = await this.SVC.findAll();
    return things?.map((thing) => this.MAP.thingToDto(thing));
  }

  /**
   * Gets the identified thing
   *
   * @param id A thing id
   * @returns A thing DTO
   */
  @Get('/:id')
  async getOne(@Param('id') id: string): Promise<ThingDto> {
    this.LOGGER.log(`Get thing with id=${id}.`);
    const thing = await this.SVC.findOneById(id);

    if (!thing) throw new NotFoundException('Thing does not exist.');

    return this.MAP.thingToDto(thing);
  }

  /**
   * Updates the identified thing
   *
   * @param id A thing id
   * @param updates A thing-update DTO
   */
  @Patch('/:id')
  async updateOne(
    @Param('id') id: string,
    @Body() updates: ThingUpdateDto
  ): Promise<void> {
    this.LOGGER.log(
      `Update thing with id=${id}, updates=${JSON.stringify(updates)}.`
    );
    await this.SVC.update(id, updates);
  }

  /**
   * Deletes the identified thing
   *
   * @param id A thing id
   */
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    this.LOGGER.log(`Delete thing with id=${id}.`);
    await this.SVC.delete(id);
  }
}
