import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { CareSpaceTemplateGuard } from '../support/care-space-template-guard';
import {
  DEFAULT_SLOT_CAPACITY,
  DEFAULT_SLOT_MINUTES,
  bandMode,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  TemplateResponseDto,
  UpdateTemplateDto,
} from '../../../presentation/dto';
import { assertFirstSlotFits } from '../support/assert-first-slot-fits';
import { assertFlexibleRules } from '../support/assert-flexible-rules';
import { isFlexibleBand } from '../../../domain/catalog/flexible-band';

/** Edita las franjas de una plantilla. */
@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
    private readonly careSpaces: CareSpaceTemplateGuard,
  ) {
    this.logger.setContext(UpdateTemplateUseCase.name);
  }

  /**
   * Edita una plantilla ya publicada (TAREA-10, punto 16 — `/schedule/edit`).
   *
   * ## Qué cambia y qué no
   *
   * Los campos escalares (nombre, duración por defecto, política, vigencia) se
   * escriben tal cual llegan; los que no vienen **se conservan**, mismo
   * criterio que `PUT /community/profiles/me`. Si `rules` viene, **reemplaza
   * el conjunto entero** — no hay «agregar una franja» —, con la misma
   * validación de `createTemplate`: la franja tiene que empezar antes de
   * terminar y el turno tiene que entrar en ella.
   *
   * ## Por qué no toca los cupos ya materializados
   *
   * `bookable_slots.schedule_template_id` es la única referencia entre las dos
   * tablas; ningún cupo apunta a una fila de `schedule_rules`. Cambiar las
   * franjas no puede, entonces, invalidar un cupo que ya existe — sólo cambia
   * lo que `generate-slots` va a producir la próxima vez que se llame. Mismo
   * principio que ya usa `retireTemplate`: la plantilla es la fuente de verdad
   * para el futuro, no una llave que reescribe el pasado.
   *
   * ## Por qué no hay comprobación de citas comprometidas
   *
   * A diferencia de retirar, editar no le quita nada a nadie: los cupos ya
   * reservados siguen existiendo con su horario propio
   * (`bookable_slots.start_at`/`end_at`), que esta operación no toca.
   *
   * ## La concurrencia la resuelve `row_version`
   *
   * `ScheduleTemplates` declara `@Version()`; si dos ediciones chocan, el
   * segundo `flush()` lanza `OptimisticLockError` y el filtro global de
   * excepciones ya lo traduce a la respuesta correcta — no hay nada que
   * capturar acá (AC-10-16).
   */
  async execute(
    templateId: string,
    dto: UpdateTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<TemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.update', templateId },
      'Updating schedule template',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId: template.resourceId,
        });
      }
      this.careSpaces.assertResourceInActiveTenant(resource);
      this.access.assertActorResource(resource, actor);

      // F5d · el espacio del horario. `undefined` lo conserva, `null` lo suelta y un id lo
      // cambia (con las mismas reglas que al publicar). El tenant de la plantilla lo fija el
      // recurso, no el cuerpo.
      const previousCareSpaceId = template.careSpaceId ?? null;
      let nextCareSpaceId = previousCareSpaceId;
      let nextSiteId: string | null = null;
      if (dto.careSpaceId === null) {
        nextCareSpaceId = null;
      } else if (dto.careSpaceId !== undefined) {
        const space = await this.careSpaces.attach(
          tx,
          resource,
          dto.careSpaceId,
          actor,
        );
        nextCareSpaceId = space.id;
        nextSiteId = space.practiceSiteId;
      }

      if (dto.name !== undefined) template.name = dto.name;
      if (dto.slotMinutes !== undefined) {
        template.slotMinutes = dto.slotMinutes;
      }
      if (dto.bookingPolicyId !== undefined) {
        template.bookingPolicyId = dto.bookingPolicyId;
      }
      if (dto.validFrom !== undefined) {
        template.validFrom = new Date(dto.validFrom);
      }
      if (dto.validTo !== undefined) template.validTo = new Date(dto.validTo);

      let ruleCount = (
        await this.catalogRepo.findRulesByTemplate(tx, templateId)
      ).length;

      if (dto.rules !== undefined) {
        const effectiveSlotMinutes =
          dto.slotMinutes ?? template.slotMinutes ?? DEFAULT_SLOT_MINUTES;

        // Horario flexible (P36): el modo de la plantilla no cambia por PATCH,
        // pero las franjas nuevas tienen que respetarlo. Con la plantilla en
        // turnos fijos, cada franja nueva dice el suyo (v4.2.64), igual que al
        // publicar.
        const flexible = template.flexibleHours === true;
        const flexibleRules = dto.rules.filter((rule) =>
          isFlexibleBand(flexible, rule),
        );
        if (flexibleRules.length > 0) {
          assertFlexibleRules(flexibleRules, effectiveSlotMinutes);
        }

        for (const rule of dto.rules) {
          if (rule.startTime >= rule.endTime) {
            throw new PreconditionFailedException(
              'La franja debe empezar antes de terminar',
              { dayOfWeek: rule.dayOfWeek },
            );
          }
          if (!isFlexibleBand(flexible, rule)) {
            assertFirstSlotFits(
              rule,
              dto.rules,
              rule.slotMinutes ?? effectiveSlotMinutes,
            );
          }
        }

        await this.catalogRepo.deleteRulesByTemplate(tx, templateId);
        for (const rule of dto.rules) {
          const flexibleBand = isFlexibleBand(flexible, rule);
          this.catalogRepo.createRule(tx, {
            scheduleTemplateId: templateId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            slotMinutes: flexibleBand
              ? undefined
              : (rule.slotMinutes ?? effectiveSlotMinutes),
            capacityPerSlot: flexibleBand
              ? undefined
              : (rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY),
            gapMinutes: rule.gapMinutes,
            bookingModeConceptId: bandMode(rule.bookingMode),
            telemedicineEnabled: rule.telemedicineEnabled === true,
            flexibleHours: flexibleBand,
            actorUserId: actor.id,
          });
        }
        ruleCount = dto.rules.length;
      }

      // Con espacio, la plantilla que queda (franjas, vigencia y espacio finales) no puede pisar a
      // otra publicada en el mismo espacio. Sólo una plantilla vigente ocupa el espacio.
      if (
        nextCareSpaceId !== null &&
        template.statusConceptId === CONCEPTS.TEMPLATE_PUBLISHED
      ) {
        await this.careSpaces.assertNoOverlap(tx, {
          resource,
          careSpaceId: nextCareSpaceId,
          templateId: template.id,
          validFrom: template.validFrom,
          validTo: template.validTo,
          bands:
            dto.rules ??
            (await this.catalogRepo.findRulesByTemplate(tx, templateId)),
        });
      }
      const spaceChanged = nextCareSpaceId !== previousCareSpaceId;
      if (spaceChanged) {
        // Columna anulable: soltar el espacio es escribir NULL, no dejar el campo sin tocar.
        (template as { careSpaceId?: string | null }).careSpaceId =
          nextCareSpaceId;
      }

      touch(template, actor.id);
      await tx.flush();

      if (spaceChanged) {
        await this.careSpaces.announce(tx, {
          tenantId: resource.tenantId,
          templateId: template.id,
          resourceId: resource.id,
          careSpaceId: nextCareSpaceId,
          previousCareSpaceId,
          siteId: nextSiteId,
          actorUserId: actor.id,
        });
      }

      return {
        id: template.id,
        name: template.name,
        ruleCount,
        statusConceptId: template.statusConceptId,
        flexibleHours: template.flexibleHours === true,
        ...(nextCareSpaceId ? { careSpaceId: nextCareSpaceId } : {}),
      };
    });
  }
}
