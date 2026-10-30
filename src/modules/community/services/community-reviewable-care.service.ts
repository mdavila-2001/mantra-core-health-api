import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfilesRepository, ReviewsRepository } from '../repositories';
import { EncountersRepository } from '../../clinical/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import { AppointmentBookings } from '../../scheduling/entities/appointment_bookings.entity';
import type { ReviewableCareDto } from '../dto';

/**
 * Puente entre una atención y la reseña pública: dice si la atención de una
 * reserva se puede calificar y con qué encuentro.
 *
 * La encuesta del paciente cuelga de una **reserva**; la reseña exige un
 * **encuentro** (`POST /patients/me/reviews`). El paciente no conoce el uuid del
 * encuentro, así que acá se recorre la cadena reserva → `appointment_id` →
 * `clinical.encounters.appointment_id`.
 *
 * `canReview` aplica **las mismas condiciones que `assertEligibleCare` y
 * `publishReview`** (encuentro del paciente, terminado, vitrina del profesional
 * que acepta reseñas y sin reseña previa): si dice `true`, el POST no la rechaza
 * por elegibilidad. Es una lectura de cortesía para la pantalla, no una
 * autorización: el POST vuelve a comprobar todo.
 *
 * ## No confirma existencia de uuids ajenos
 *
 * Una reserva inexistente, de otra persona o de otro tenant responde igual: 404
 * con el mismo mensaje y sin `details`. Un encuentro que no es del paciente se
 * trata como «todavía sin encuentro».
 *
 * **No toca nada de la encuesta**: la reseña es pública y la encuesta privada;
 * nada de una viaja con la otra.
 */
@Injectable()
export class CommunityReviewableCareService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param profilesRepo - Vitrinas públicas.
   * @param reviewsRepo - Reseñas.
   * @param encountersRepo - Atenciones clínicas.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly encountersRepo: EncountersRepository,
  ) {}

  /**
   * Si la atención de una reserva propia se puede reseñar.
   *
   * @param appointmentBookingId - Reserva consultada.
   * @param actor - El paciente autenticado.
   * @returns El encuentro, el profesional y las dos banderas.
   * @throws ForbiddenException si la sesión no es de un paciente.
   * @throws ResourceNotFoundException si la reserva no existe, no es del
   *   paciente o es de otro tenant (el mismo 404 en los tres casos).
   */
  async getReviewableCare(
    appointmentBookingId: string,
    actor: AuthenticatedUser,
  ): Promise<ReviewableCareDto> {
    const patientProfileId = actor.patientProfileId;
    if (!patientProfileId) {
      throw new ForbiddenException(
        'Sólo un paciente puede consultar sus atenciones',
      );
    }
    const tenantId = requireTenantId();
    const em = this.em.fork();

    const booking = await em.findOne(AppointmentBookings, {
      id: appointmentBookingId,
    });
    if (
      !booking ||
      booking.patientProfileId !== patientProfileId ||
      booking.tenantId !== tenantId
    ) {
      throw new ResourceNotFoundException('Atención no encontrada');
    }

    const withoutEncounter: ReviewableCareDto = {
      encounterId: null,
      appointmentBookingId: booking.id,
      practitionerDisplayName: null,
      startAt: null,
      alreadyReviewed: false,
      canReview: false,
    };
    if (!booking.appointmentId) return withoutEncounter;

    const latest = await this.encountersRepo.findLatestIdsByAppointmentIds(em, [
      booking.appointmentId,
    ]);
    const encounterId = latest.get(booking.appointmentId);
    if (!encounterId) return withoutEncounter;

    const encounter = await this.encountersRepo.findById(em, encounterId);
    if (!encounter || encounter.patientProfileId !== patientProfileId) {
      return withoutEncounter;
    }

    const showcase = encounter.primaryPractitionerId
      ? await this.profilesRepo.findByTarget(
          em,
          encounter.primaryPractitionerId,
        )
      : null;
    const alreadyReviewed = showcase
      ? (await this.reviewsRepo.findByReviewerEncounter(
          em,
          patientProfileId,
          showcase.id,
          encounter.id,
        )) !== null
      : false;

    const finished = encounter.statusConceptId === CLIN.ENCOUNTER_FINISHED;
    const acceptsReviews =
      showcase !== null && showcase.acceptsReviews !== false;

    return {
      encounterId: encounter.id,
      appointmentBookingId: booking.id,
      practitionerDisplayName: showcase?.displayName ?? null,
      startAt: encounter.startAt ?? null,
      alreadyReviewed,
      canReview: finished && acceptsReviews && !alreadyReviewed,
    };
  }
}
