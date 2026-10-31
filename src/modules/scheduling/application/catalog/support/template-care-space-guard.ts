import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import type { SchedulableResources } from '../../../entities';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  CARE_SPACE_DIRECTORY_PORT,
  type CareSpaceDirectoryPort,
} from '../../ports/care-space-directory.port';
import {
  bandLabel,
  intervalInWeek,
  isExpired,
  overlap,
  referenceWeek,
} from '../../../domain/catalog/week-bands';

/** Funciones de espacio que admite una plantilla (§F5d). */
const TEMPLATE_FUNCTIONS = [
  'SPACE_FN_CONSULTING_ROOM',
  'SPACE_FN_PROCEDURE_ROOM',
  'SPACE_FN_IMAGING_ROOM',
];

/** Una franja como la reciben las plantillas. */
interface Band {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Consultorio de una plantilla (CONTRATO-F2-F5 §F5d): espacio del tenant del
 * recurso (404), función consultorio/procedimiento/imagen agendable (422
 * `TEMPLATE_CARE_SPACE_INVALID_FUNCTION`), de la práctica del recurso (422
 * `TEMPLATE_CARE_SPACE_SITE_MISMATCH`) y sin otra plantilla publicada que lo
 * ocupe a la misma hora (422 `TEMPLATE_RULE_OVERLAP_CARE_SPACE`).
 */
@Injectable()
export class TemplateCareSpaceGuard {
  constructor(
    @Inject(CARE_SPACE_DIRECTORY_PORT)
    private readonly spaces: CareSpaceDirectoryPort,
    private readonly catalogRepo: SchedulingCatalogRepository,
  ) {}

  async assert(
    tx: EntityManager,
    resource: SchedulableResources,
    careSpaceId: string,
    rules: readonly Band[],
    validFrom: Date | undefined,
    exceptTemplateId?: string,
  ): Promise<void> {
    const space = await this.spaces.describe(tx, careSpaceId);
    if (!space || space.tenantId !== resource.tenantId)
      throw new ResourceNotFoundException('Espacio no encontrado', {
        careSpaceId,
      });
    if (
      !space.functionCode ||
      !TEMPLATE_FUNCTIONS.includes(space.functionCode) ||
      !space.schedulable ||
      !space.active
    )
      throw new PreconditionFailedException(
        'El espacio no es un consultorio agendable',
        { functionCode: space.functionCode },
        SchedulingErrorReason.TEMPLATE_CARE_SPACE_INVALID_FUNCTION,
      );
    if (resource.practiceId && space.practiceId !== resource.practiceId)
      throw new PreconditionFailedException(
        'El consultorio es de otra práctica que la agenda',
        {},
        SchedulingErrorReason.TEMPLATE_CARE_SPACE_SITE_MISMATCH,
      );
    const week = referenceWeek(validFrom ?? new Date());
    const zone = resource.timeZone ?? 'UTC';
    const mine = rules.map((r) => ({
      label: bandLabel(r),
      ...intervalInWeek(week, r.dayOfWeek, r.startTime, r.endTime, zone),
    }));
    const others = await this.catalogRepo.findRulesByCareSpace(
      tx,
      careSpaceId,
      CONCEPTS.TEMPLATE_PUBLISHED,
      exceptTemplateId,
    );
    for (const other of others) {
      if (isExpired(other.validTo, week.start)) continue;
      const existing = {
        label: bandLabel(other.rule),
        ...intervalInWeek(
          week,
          other.rule.dayOfWeek,
          other.rule.startTime,
          other.rule.endTime,
          other.timeZone ?? 'UTC',
        ),
      };
      const clash = mine.find((m) => overlap(m, existing));
      if (clash)
        throw new PreconditionFailedException(
          `El consultorio ya está ocupado por «${other.templateName}» el ${existing.label}.`,
          { nueva: clash.label, existente: existing.label },
          SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_CARE_SPACE,
        );
    }
  }

  /** Evento `scheduling.template.care_space_set`. */
  announce(
    tx: EntityManager,
    tenantId: string,
    templateId: string,
    careSpaceId: string | null,
    actorUserId: string,
  ): Promise<void> {
    return this.spaces.announceTemplateCareSpace(tx, {
      tenantId,
      templateId,
      careSpaceId,
      actorUserId,
    });
  }
}
