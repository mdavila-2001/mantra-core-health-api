import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  DEFAULT_SLOT_CAPACITY,
  DEFAULT_SLOT_MINUTES,
  MAX_SLOTS_PER_RUN,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
} from '../../../presentation/dto';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';
import {
  localTimeToUtc,
  matchingLocalDays,
} from '../../../domain/time/scheduling-time';
import { nextBandStart } from '../../../domain/catalog/week-bands';

/** UC-41-03: materializa los cupos de una plantilla. */
@Injectable()
export class GenerateSlotsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GenerateSlotsUseCase.name);
  }

  async execute(
    templateId: string,
    dto: GenerateSlotsDto,
    actor: AuthenticatedUser,
  ): Promise<GenerateSlotsResponseDto> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        {
          from: dto.from,
          to: dto.to,
        },
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.slots.generate',
        templateId,
        from: dto.from,
        to: dto.to,
      },
      'Generating bookable slots',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }

      // La zona de la sede, que es en la que están escritas las reglas. Sin
      // recurso —o sin zona declarada— se cae a UTC, que es exactamente lo que
      // hacía antes: así una agenda sin zona no cambia de comportamiento.
      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      const zone = resource?.timeZone ?? 'UTC';
      if (resource) this.access.assertActorResource(resource, actor);

      // REGLA MADRE (AG-1): los cupos que caerían sobre un compromiso del
      // profesional no se generan. Se cargan UNA vez para toda la ventana —
      // consultar por cupo sería un viaje a la base por cada media hora—.
      const commitments =
        resource &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
          ? await this.professionalTime.commitments(
              tx,
              resource.resourceRefId,
              from,
              to,
            )
          : [];

      const rules = await this.catalogRepo.findRulesByTemplate(tx, templateId);
      const existing = await this.catalogRepo.findSlotsByTemplateInRange(
        tx,
        templateId,
        from,
        to,
      );
      const existingStarts = new Set(
        existing.map((slot) => slot.startAt.getTime()),
      );

      let created = 0;
      let skipped = 0;
      let omittedByCommitments = 0;

      for (const rule of rules) {
        // Una franja sólo de servicios no genera cupos de consulta: sus turnos nacen
        // al retener, con la duración de cada servicio, y una grilla fija encima
        // ofrecería horarios que la agenda de servicios no respeta.
        if (rule.bookingModeConceptId === SCHED.RULE_MODE_SERVICES) continue;
        const slotMinutes =
          rule.slotMinutes ?? template.slotMinutes ?? DEFAULT_SLOT_MINUTES;
        const capacity = rule.capacityPerSlot ?? DEFAULT_SLOT_CAPACITY;
        // El respiro entre consultas. Ausente ≡ 0: la columna es anulable y
        // nadie está obligado a declararlo.
        //
        // El PASO del generador es `slot + gap`; la DURACIÓN de cada turno
        // sigue siendo `slot`. Confundirlos alargaría la consulta en vez de
        // separarla de la siguiente, que es justo lo contrario de lo que el
        // respiro existe para hacer.
        const gapMinutes = rule.gapMinutes ?? 0;
        const stepMinutes = slotMinutes + gapMinutes;

        // Redondeo hacia adelante (propietario, 2026-10-04): el último turno
        // se COMPLETA aunque pase la hora de fin —cada hora le cuesta dinero al
        // médico, y cortarlo le regalaba el tramo final—. El único tope es la
        // franja siguiente del mismo día: el turno extendido no la pisa.
        const next = nextBandStart(rule, rules);

        for (const day of matchingLocalDays(from, to, rule.dayOfWeek, zone)) {
          const dayStart = localTimeToUtc(day, rule.startTime, zone);
          const dayEnd = localTimeToUtc(day, rule.endTime, zone);
          const cap = next === null ? null : localTimeToUtc(day, next, zone);

          for (
            let cursor = dayStart;
            cursor < dayEnd;
            cursor = new Date(cursor.getTime() + stepMinutes * 60_000)
          ) {
            const end = new Date(cursor.getTime() + slotMinutes * 60_000);
            if (cap !== null && end > cap) break;
            // El barrido de días locales se ensancha un día por lado, porque un
            // día de la sede puede empezar antes de `from` o terminar después de
            // `to`. Acá se recorta a lo que se pidió: sin esto, una ventana de
            // un día en una zona al oeste de UTC materializaría cupos del día
            // anterior.
            if (cursor < from || end > to) continue;

            if (existingStarts.has(cursor.getTime())) {
              skipped += 1;
              continue;
            }
            // El cupo que pisa un compromiso se SALTEA, no aborta la corrida:
            // la cirugía del jueves no puede impedir generar el resto del mes.
            if (
              commitments.some(
                (commitment: { startAt: Date; endAt: Date }) =>
                  commitment.startAt < end && commitment.endAt > cursor,
              )
            ) {
              omittedByCommitments += 1;
              continue;
            }
            if (created >= MAX_SLOTS_PER_RUN) {
              this.logger.warn(
                { operation: 'scheduling.slots.generate', templateId, created },
                'Slot generation hit the per-run cap; narrow the window and re-run',
              );
              return { templateId, created, skipped, omittedByCommitments };
            }

            this.catalogRepo.createSlot(tx, {
              resourceId: template.resourceId,
              scheduleTemplateId: templateId,
              startAt: cursor,
              endAt: end,
              capacity,
              remainingCapacity: capacity,
              statusConceptId: CONCEPTS.SLOT_OPEN,
              actorUserId: actor.id,
            });
            existingStarts.add(cursor.getTime());
            created += 1;
          }
        }
      }

      return { templateId, created, skipped, omittedByCommitments };
    });
  }
}
