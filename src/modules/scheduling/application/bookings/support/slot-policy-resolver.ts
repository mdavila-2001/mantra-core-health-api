import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Política de reserva efectiva de un cupo. */

@Injectable()
export class SlotPolicyResolver {
  constructor(private readonly catalogRepo: SchedulingCatalogRepository) {}

  /** Política efectiva del slot, heredada de su plantilla. */
  async resolvePolicy(tx: EntityManager, templateId: string) {
    const template = await this.catalogRepo.findTemplateById(tx, templateId);
    if (!template?.bookingPolicyId) return null;
    return this.catalogRepo.findPolicyById(tx, template.bookingPolicyId);
  }
}
