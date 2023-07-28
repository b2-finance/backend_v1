import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thing } from '../entity/thing.entity';
import { LogService } from 'src/log/log.service';

/**
 * Provides services for manipulating thing entities
 */
@Injectable()
export class ThingService {
  constructor(
    @InjectRepository(Thing) private readonly REPO: Repository<Thing>,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(ThingService.name);
  }

  /**
   * Creates a new thing
   *
   * @param thing A thing
   * @returns The created thing
   */
  async create(thing: Thing): Promise<Thing> {
    return this.REPO.save(thing);
  }

  /**
   * Finds all things
   *
   * @returns A list of things
   */
  async findAll(): Promise<Thing[]> {
    return this.REPO.find();
  }

  /**
   * Finds the identified thing
   *
   * @param id A thing id
   * @returns The identified thing, or null if it does not exist
   */
  async findOneById(id: string): Promise<Thing> {
    return this.REPO.findOneBy({ id });
  }

  /**
   * Updates the identified thing
   *
   * @param id A thing id
   * @param updates Updates to the thing
   */
  async update(id: string, updates: Partial<Thing>): Promise<void> {
    await this.REPO.update(id, updates);
  }

  /**
   * Deletes the identified thing
   *
   * @param id A thing id
   */
  async delete(id: string): Promise<void> {
    await this.REPO.delete(id);
  }
}
