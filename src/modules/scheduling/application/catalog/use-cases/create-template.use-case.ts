import { AgendaOverlapGuard } from '../support/agenda-overlap-guard';
import { TemplateCareSpaceGuard } from '../support/template-care-space-guard';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  CreateTemplateDto,
  TemplateResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_SLOT_CAPACITY,
  DEFAULT_SLOT_MINUTES,
  bandMode,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { assertFirstSlotFits } from '../support/assert-first-slot-fits';
import { assertFlexibleRules } from '../support/assert-flexible-rules';
import { isFlexibleBand } from '../../../domain/catalog/flexible-band';

/** UC-41-02: publica una plantilla con franjas semanales. */
@Injectable()
export class CreateTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly overlapGuard: AgendaOverlapGuard,
    private readonly logger: PinoLogger,
    private readonly careSpaceGuard?: TemplateCareSpaceGuard,
  ) {
    this.logger.setContext(CreateTemplateUseCase.name);
  }

  /** UC-41-02: publica la plantilla con sus franjas semanales. */
  async execute(
    resourceId: string,
    dto: CreateTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<TemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.create', resourceId },
      'Publishing schedule template',
    );

    const flexible = dto.flexibleHours === true;
    // Con la plantilla flexible, todas sus franjas lo son; si no, cada franja
    // dice el suyo (v4.2.64). Las flexibles se validan igual que siempre.
    const flexibleRules = dto.rules.filter((rule) =>
      isFlexibleBand(flexible, rule),
    );
    if (flexibleRules.length > 0) {
      assertFlexibleRules(
        flexibleRules,
        dto.slotMinutes ?? DEFAULT_SLOT_MINUTES,
      );
    }

    for (const rule of dto.rules) {
      if (rule.startTime >= rule.endTime) {
        throw new PreconditionFailedException(
          'La franja debe empezar antes de terminar',
          {
            dayOfWeek: rule.dayOfWeek,
          },
        );
      }

      // REQ-10-026: un día sin ningún turno no puede publicarse en silencio.
      // Con el redondeo hacia adelante una franja siempre da al menos uno —el
      // último se completa aunque pase la hora de fin—, salvo que ese turno
      // pise la franja siguiente del mismo día.
      // En horario flexible no hay redondeo hacia adelante: la consulta tiene
      // que caber entera dentro de la franja, y eso ya lo exigió
      // `assertFlexibleRules`. Lo de acá mide el primer turno de una grilla.
      if (!isFlexibleBand(flexible, rule)) {
        assertFirstSlotFits(
          rule,
          dto.rules,
          rule.slotMinutes ?? dto.slotMinutes ?? DEFAULT_SLOT_MINUTES,
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId,
        });
      }
      this.access.assertActorResource(resource, actor);
      await this.overlapGuard.assertNoOverlapWithOtherAgendas(
        tx,
        resource,
        dto,
      );
      if (dto.careSpaceId)
        await this.careSpaceGuard!.assert(
          tx,
          resource,
          dto.careSpaceId,
          dto.rules,
          dto.validFrom ? new Date(dto.validFrom) : undefined,
        );

      const template = this.catalogRepo.createTemplate(tx, {
        resourceId,
        name: dto.name,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        slotMinutes: dto.slotMinutes ?? DEFAULT_SLOT_MINUTES,
        flexibleHours: flexible,
        bookingPolicyId: dto.bookingPolicyId,
        careSpaceId: dto.careSpaceId,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        actorUserId: actor.id,
      });
      // FK planas: persistir la plantilla ANTES de crear las franjas que la
      // referencian. `schedule_template_id` es una columna uuid suelta y no una
      // relación declarada, así que la unidad de trabajo no conoce la
      // dependencia y ordena los inserts por el orden en que descubrió las
      // entidades —donde `ScheduleRules` va antes que `ScheduleTemplates`—,
      // insertando las franjas primero y violando la FK.
      //
      // No es teórico: `POST /scheduling/resources/:id/templates` respondía 500
      // a toda petición, de modo que no se podía publicar una agenda ni, por
      // tanto, generar slots ni reservar. Cubierto por
      // `test/integration/frontend-read-flows.int-spec.ts`.
      await tx.flush();

      for (const rule of dto.rules) {
        const flexibleBand = isFlexibleBand(flexible, rule);
        this.catalogRepo.createRule(tx, {
          scheduleTemplateId: template.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          // Horario flexible: la franja no tiene turnos que medir ni contar.
          // Lo que dura cada consulta vive en la plantilla (`slotMinutes`) y
          // escribirlo también acá serían dos fuentes para el mismo número.
          slotMinutes: flexibleBand
            ? undefined
            : (rule.slotMinutes ?? dto.slotMinutes ?? DEFAULT_SLOT_MINUTES),
          capacityPerSlot: flexibleBand
            ? undefined
            : (rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY),
          // Sin `?? 0`: la columna es anulable a propósito y ausente se lee
          // como cero al generar. Escribir un cero que nadie declaró borraría
          // la diferencia entre «no lo dijeron» y «dijeron que no hay respiro».
          gapMinutes: rule.gapMinutes,
          bookingModeConceptId: bandMode(rule.bookingMode),
          telemedicineEnabled: rule.telemedicineEnabled === true,
          flexibleHours: flexibleBand,
          actorUserId: actor.id,
        });
      }

      if (dto.careSpaceId) {
        await tx.flush();
        await this.careSpaceGuard!.announce(
          tx,
          resource.tenantId,
          template.id,
          dto.careSpaceId,
          actor.id,
        );
      }
      return {
        id: template.id,
        name: dto.name,
        ruleCount: dto.rules.length,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        flexibleHours: flexible,
        careSpaceId: dto.careSpaceId ?? null,
      };
    });
  }
}
