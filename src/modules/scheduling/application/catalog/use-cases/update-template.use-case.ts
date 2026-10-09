import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
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

/** Edita las franjas de una plantilla. */
@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
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
      this.access.assertActorResource(resource, actor);

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

        for (const rule of dto.rules) {
          if (rule.startTime >= rule.endTime) {
            throw new PreconditionFailedException(
              'La franja debe empezar antes de terminar',
              { dayOfWeek: rule.dayOfWeek },
            );
          }
          assertFirstSlotFits(
            rule,
            dto.rules,
            rule.slotMinutes ?? effectiveSlotMinutes,
          );
        }

        await this.catalogRepo.deleteRulesByTemplate(tx, templateId);
        for (const rule of dto.rules) {
          this.catalogRepo.createRule(tx, {
            scheduleTemplateId: templateId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            slotMinutes: rule.slotMinutes ?? effectiveSlotMinutes,
            capacityPerSlot: rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY,
            gapMinutes: rule.gapMinutes,
            bookingModeConceptId: bandMode(rule.bookingMode),
            actorUserId: actor.id,
          });
        }
        ruleCount = dto.rules.length;
      }

      touch(template, actor.id);
      await tx.flush();

      return {
        id: template.id,
        name: template.name,
        ruleCount,
        statusConceptId: template.statusConceptId,
      };
    });
  }
}
