import { maskPatientName } from '../../domain/agenda/patient-name-mask';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import { VISIBLE_BOOKING_STATES } from '../../domain/booking/booking-states';
import {
  composeAgendaItem,
  countWaitlistFor,
  validateAgendaRange,
  type AgendaItem,
} from '../../domain/booking/support-agenda';
import { SchedulingSupportAgendaRepository } from '../../infrastructure/repositories';
import type {
  SupportAgendaQueryDto,
  SupportAgendaResponseDto,
} from '../../presentation/dto';
import {
  SUPPORT_AGENDA_POLICY_PORT,
  type SupportAgendaPolicyPort,
} from '../ports/support-agenda-policy.port';
import { BookingAccess } from '../bookings/support/booking-access';

/** Tope de citas por lectura. */
const AGENDA_LIMIT = 1000;

/**
 * Agenda combinada de la persona de apoyo: las citas de una organización en un
 * rango, de todos los doctores que cubre, con la política ya resuelta por cita
 * (qué puede hacer) y, cuando no puede ver una, el motivo. Sin `schedule.view` la
 * cita sale como un bloque ocupado, sin paciente, sin servicio y sin `bookingId`;
 * y sin ningún permiso `schedule.*` aplicable a la cita no sale ni el bloque. La
 * organización sale de su vínculo (`org`, o `tenantId`), contrastado con la
 * política: sin vínculo ahí, 403. Cada paciente que la lectura revela queda en el
 * asiento de acceso (`patient_profile_id`).
 *
 * Cada cita que la persona puede ver trae además cuánta gente espera ese horario
 * (`waitlistCount`, ausente si nadie), y las opciones de filtro (doctores,
 * servicios, ubicaciones) salen solo de lo que ve.
 */
@Injectable()
export class SchedulingSupportAgendaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas de la agenda.
   * @param policy - Política del personal de apoyo.
   * @param access - Acceso a citas (sella la lectura).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SchedulingSupportAgendaRepository,
    @Inject(SUPPORT_AGENDA_POLICY_PORT)
    private readonly policy: SupportAgendaPolicyPort,
    private readonly access: BookingAccess,
  ) {}

  /**
   * Arma la agenda combinada.
   *
   * @param query - Organización, rango y filtros.
   * @param actor - La persona de apoyo.
   * @returns Opciones de filtro y citas con su política resuelta.
   */
  async list(
    query: SupportAgendaQueryDto,
    actor: AuthenticatedUser,
  ): Promise<SupportAgendaResponseDto> {
    if (query.org && query.tenantId && query.org !== query.tenantId) {
      throw new BadRequestException(
        'Los parámetros «org» y «tenantId» llegaron con valores distintos.',
      );
    }
    const org = (query.org ?? query.tenantId) as string;
    const from = new Date(query.from);
    const to = new Date(query.to);
    const range = validateAgendaRange(from, to);
    if (!range.ok) throw new PreconditionFailedException(range.reason ?? '');
    // Con RLS las consultas corren en UNA transacción acotada a la organización
    // (`inTenantScope`) y usan esa transacción; el sello va después, fuera de ella.
    const { body, accesses, patients } = await this.policy.inTenantScope(
      this.em,
      org,
      async (tx) => {
        const evaluate = await this.policy.evaluator(actor.id, org, tx);
        // Sin vínculo vigente en la organización (nunca lo tuvo, o terminó, venció
        // o está suspendido) no hay agenda que armar: 403, con el mismo mensaje.
        const standing = evaluate({ action: 'schedule.view' }).reason;
        if (
          standing === 'NO_ENGAGEMENT' ||
          standing === 'ENGAGEMENT_INACTIVE'
        ) {
          throw new ForbiddenException(
            'No tiene un vínculo de apoyo en esa organización',
          );
        }
        const rows = await this.repo.findRows(
          tx,
          org,
          from,
          to,
          VISIBLE_BOOKING_STATES,
          {
            doctors: query.doctors,
            services: query.services,
            locations: query.locations,
          },
          AGENDA_LIMIT,
        );
        // Las condiciones de los permisos miran al paciente de cada cita: sus
        // hechos se cargan en LOTE, una vez para toda la lista.
        await evaluate.prime?.([
          ...new Set(
            rows
              .map((row) => row.patientProfileId)
              .filter((id): id is string => !!id),
          ),
        ]);
        // Una cita sin ningún permiso `schedule.*` aplicable no se muestra ni
        // como bloque: tener un vínculo vivo no da la agenda de toda la organización.
        const composed = rows
          .map((row) =>
            composeAgendaItem(row, (question) =>
              evaluate({
                action: question.action,
                practitionerProfileId: question.practitionerProfileId,
                healthcareServiceId: question.healthcareServiceId,
                careSpaceId: question.careSpaceId,
                ...(question.context ? { context: question.context } : {}),
              }),
            ),
          )
          .filter((item) => item.covered)
          .map(maskFields);
        // La espera de un horario solo se cuenta en las citas que la persona ve:
        // el bloque de una cita ajena sale sin paciente, sin motivo y sin esa cifra.
        const waits = await this.repo.findActiveWaits(tx, org, [
          ...new Set(
            composed
              .filter((i) => i.allowedActions.includes('schedule.view'))
              .map((i) => i.resourceId)
              .filter((id): id is string => !!id),
          ),
        ]);
        const items = composed.map((item) => {
          if (!item.allowedActions.includes('schedule.view')) return item;
          const waitlistCount = countWaitlistFor(
            waits,
            item.resourceId,
            item.startAt,
          );
          return waitlistCount > 0 ? { ...item, waitlistCount } : item;
        });
        const viewed = items.filter((i) =>
          i.allowedActions.includes('schedule.view'),
        );
        return {
          body: await this.withOptions(tx, viewed, items),
          accesses: viewed.flatMap((item) =>
            item.grantIds.map((grantId) => ({
              grantId,
              practitionerProfileId: item.practitionerProfileId,
            })),
          ),
          patients: [
            ...new Set(
              viewed
                .map((item) => item.patientProfileId)
                .filter((id): id is string => !!id),
            ),
          ],
        };
      },
    );
    await this.access.sealSupportAgendaView(actor, org, accesses, patients);
    return body;
  }

  /** Opciones de filtro: solo lo que la persona cubre en lo que ve. */
  private async withOptions(
    em: EntityManager,
    viewed: readonly AgendaItem[],
    items: readonly AgendaItem[],
  ): Promise<SupportAgendaResponseDto> {
    const ids = (pick: (i: AgendaItem) => string | undefined): string[] => [
      ...new Set(viewed.map(pick).filter((v): v is string => !!v)),
    ];
    const doctors = ids((i) => i.practitionerProfileId);
    const services = ids((i) => i.healthcareServiceId);
    const spaces = ids((i) => i.careSpaceId);
    const names = await this.repo.namesOf(em, { doctors, services, spaces });
    return {
      // En el orden de la bandeja de chat: de él sale el color de cada doctor.
      doctors: this.policy.orderDoctors(
        doctors.map((id) => ({
          practitionerProfileId: id,
          displayName: names.doctors.get(id) ?? '',
        })),
      ),
      services: services.map((id) => ({
        id,
        name: names.services.get(id) ?? '',
      })),
      locations: spaces.map((id) => ({
        id,
        name: names.spaces.get(id)?.name ?? '',
        code: names.spaces.get(id)?.code ?? '',
      })),
      items: items.map((item) => ({
        ...(item.bookingId === undefined ? {} : { bookingId: item.bookingId }),
        resourceId: item.resourceId,
        practitionerProfileId: item.practitionerProfileId,
        startAt: item.startAt,
        endAt: item.endAt,
        statusConceptId: item.statusConceptId,
        careSpaceId: item.careSpaceId,
        ...(item.healthcareServiceId === undefined
          ? {}
          : { healthcareServiceId: item.healthcareServiceId }),
        patientProfileId: item.patientProfileId,
        patientName: item.patientName,
        ...(item.waitlistCount === undefined
          ? {}
          : { waitlistCount: item.waitlistCount }),
        allowedActions: [...item.allowedActions],
        denialReason: item.denialReason,
      })),
    };
  }
}

/**
 * Presentación de los campos de la cita según lo que la política dejó ver
 * (`visibleFields`): el nombre del paciente sale completo, parcial o no sale.
 * Sin `visibleFields` (política sin gobierno de campos) no se toca nada. El valor
 * original de un campo enmascarado nunca llega a la respuesta.
 */
function maskFields(item: AgendaItem): AgendaItem {
  const fields = item.visibleFields;
  if (!fields || item.patientName === undefined) return item;
  const strategy = fields['agenda.appointment.view.patient_name'] ?? 'NULLIFY';
  if (strategy === 'FULL') return item;
  const masked = maskPatientName(item.patientName, strategy);
  return { ...item, patientName: masked ?? undefined };
}
