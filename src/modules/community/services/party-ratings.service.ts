import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { EncountersRepository } from '../../clinical/repositories';
import { EncounterParticipants, Encounters } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { PractitionerRoleAssignments } from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import {
  AppointmentBookings,
  SchedulableResources,
} from '../../scheduling/entities';
import { COMM } from '../community.concepts';
import type {
  PartyRatingResultDto,
  RatePartyDto,
  RatingPartyType,
} from '../dto/party-rating.dto';
import {
  PartyRatingsRepository,
  type RatingBasis,
  type RatingParty,
} from '../repositories/party-ratings.repository';
import { RatingPartiesService } from './rating-parties.service';

/**
 * Quién puede calificar a quién (propietario, 2026-10-08). Paciente ↔ paciente
 * y organización ↔ organización no se califican: no hay atención ni vínculo de
 * trabajo que los una, y sólo abriría la puerta al acoso.
 */
const ALLOWED_TARGETS: Readonly<
  Record<RatingPartyType, readonly RatingPartyType[]>
> = {
  PATIENT: ['PRACTITIONER', 'ORGANIZATION'],
  PRACTITIONER: ['PATIENT', 'ORGANIZATION'],
  ORGANIZATION: ['PATIENT', 'PRACTITIONER'],
};

/**
 * Estados de un vínculo de trabajo que respaldan una calificación: el que está
 * vigente, el suspendido y el terminado («vigente o pasado»). Una solicitud
 * pendiente o rechazada nunca fue un vínculo.
 */
const QUALIFYING_ROLE_STATUSES: readonly string[] = [
  PRAC.ROLE_ASSIGNMENT_ACTIVE,
  PRAC.ROLE_ASSIGNMENT_SUSPENDED,
  PRAC.ROLE_ASSIGNMENT_ENDED,
];

/** Un único mensaje para todo rechazo de respaldo: no confirma qué existe. */
const BASIS_REJECTED =
  'La atención o el vínculo declarado no habilita esta calificación';

/**
 * Calificación en malla: médico, paciente y organización se califican entre sí
 * con estrellas del 1 al 5 (v4.2.42).
 *
 * ## Siempre hay algo real detrás
 *
 * Con un paciente de por medio, el respaldo es una **atención terminada** en la
 * que estuvieron las dos partes. Entre médico y organización, es el **vínculo
 * de trabajo** (`practice.practitioner_role_assignments`) vigente o pasado. Sin
 * respaldo, cualquiera calificaría a cualquiera — y una nota que cualquiera
 * puede escribir no le dice nada a nadie.
 *
 * ## Recalificar no duplica
 *
 * Volver a calificar el mismo respaldo actualiza la fila: la clave
 * `uq_party_ratings_basis` es autor + calificado + respaldo, y el servicio
 * busca primero y escribe después. Si dos pedidos se cruzan, el índice único
 * rechaza el segundo y se responde 409 en vez de 500.
 */
@Injectable()
export class PartyRatingsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param ratingsRepo - Acceso a `community.party_ratings`.
   * @param encountersRepo - Atenciones clínicas, que respaldan la calificación.
   * @param parties - Resolución de identidades contra la sesión.
   * @param logger - Bitácora estructurada.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ratingsRepo: PartyRatingsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly parties: RatingPartiesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PartyRatingsService.name);
  }

  /**
   * Califico (o recalifico) a una parte.
   *
   * @param dto - Identidad con la que califico, a quién, respaldo y estrellas.
   * @param actor - La sesión.
   * @returns El id, las estrellas y si se creó o se actualizó.
   * @throws ForbiddenException si la sesión no tiene esa identidad o el par no
   *   se puede calificar.
   * @throws BadRequestException si falta el respaldo que el par exige.
   * @throws PreconditionFailedException si el respaldo no habilita.
   * @throws ConflictException si otro pedido escribió la misma calificación a la vez.
   */
  async rate(
    dto: RatePartyDto,
    actor: AuthenticatedUser,
  ): Promise<PartyRatingResultDto> {
    this.logger.info(
      {
        operation: 'community.party-rating.rate',
        reviewerType: dto.reviewerType,
        targetType: dto.targetType,
      },
      'Rating a party',
    );
    try {
      return await this.em.transactional(async (tx) => {
        const reviewer = await this.parties.resolveReviewer(
          tx,
          dto.reviewerType,
          dto.reviewerOrganizationId,
          actor,
        );
        const target: RatingParty = { type: dto.targetType, id: dto.targetId };
        assertPairAllowed(reviewer, target);
        const basis = await this.assertBasis(tx, reviewer, target, dto, actor);

        const previa = await this.ratingsRepo.findExisting(
          tx,
          reviewer,
          target,
          basis,
        );
        if (previa) {
          this.ratingsRepo.update(
            previa,
            dto.overallRating,
            dto.commentText,
            actor.id,
          );
          await tx.flush();
          return {
            id: previa.id,
            overallRating: previa.overallRating,
            created: false,
          };
        }

        const rating = this.ratingsRepo.create(tx, {
          reviewer,
          target,
          basis,
          overallRating: dto.overallRating,
          commentText: dto.commentText,
          moderationStatusConceptId: COMM.MODERATION_PENDING,
          actorUserId: actor.id,
        });
        await tx.flush();
        return {
          id: rating.id,
          overallRating: rating.overallRating,
          created: true,
        };
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Esta calificación se está guardando en otro pedido; vuelva a intentarlo',
          { targetType: dto.targetType },
        );
      }
      throw error;
    }
  }

  /**
   * Exige el respaldo que el par pide y lo comprueba.
   *
   * @param em - Transacción activa.
   * @param reviewer - Quién califica.
   * @param target - A quién.
   * @param dto - El cuerpo, con la atención o el vínculo declarado.
   * @param actor - La sesión.
   * @returns El respaldo comprobado.
   */
  private async assertBasis(
    em: EntityManager,
    reviewer: RatingParty,
    target: RatingParty,
    dto: RatePartyDto,
    actor: AuthenticatedUser,
  ): Promise<RatingBasis> {
    const conPaciente =
      reviewer.type === 'PATIENT' || target.type === 'PATIENT';
    if (conPaciente) {
      if (!dto.encounterId) {
        throw new BadRequestException(
          'Indique la atención terminada que respalda la calificación',
        );
      }
      await this.assertEncounterJoins(em, dto.encounterId, [reviewer, target]);
      return { encounterId: dto.encounterId };
    }

    if (!dto.roleAssignmentId) {
      throw new BadRequestException(
        'Indique el vínculo de trabajo que respalda la calificación',
      );
    }
    const practitioner = reviewer.type === 'PRACTITIONER' ? reviewer : target;
    const organization = reviewer.type === 'ORGANIZATION' ? reviewer : target;
    await this.assertNotSelf(em, practitioner, organization, actor);
    await this.assertRoleAssignment(
      em,
      dto.roleAssignmentId,
      practitioner.id,
      organization.id,
    );
    return { roleAssignmentId: dto.roleAssignmentId };
  }

  /**
   * La atención existe, terminó y estuvieron en ella las dos partes.
   *
   * @param em - Transacción activa.
   * @param encounterId - Atención declarada.
   * @param parties - Autor y calificado.
   * @throws PreconditionFailedException si no habilita.
   */
  private async assertEncounterJoins(
    em: EntityManager,
    encounterId: string,
    parties: readonly RatingParty[],
  ): Promise<void> {
    const encuentro = await this.encountersRepo.findById(em, encounterId);
    if (!encuentro) {
      throw new PreconditionFailedException(BASIS_REJECTED, { encounterId });
    }
    if (encuentro.statusConceptId !== CLIN.ENCOUNTER_FINISHED) {
      throw new PreconditionFailedException('La atención todavía no terminó', {
        encounterId,
      });
    }
    for (const party of parties) {
      if (!(await this.wasInEncounter(em, encuentro, party))) {
        throw new PreconditionFailedException(BASIS_REJECTED, { encounterId });
      }
    }
  }

  /**
   * Si una parte estuvo en la atención.
   *
   * - **Paciente:** es el paciente del encuentro.
   * - **Médico:** es el responsable declarado **o** un participante — en una
   *   atención con equipo, quien atendió puede no ser el responsable (misma
   *   regla que `CommunityReviewsService`). Los participantes se leen sin
   *   filtrar por estado: en un encuentro terminado quedan en `PART_COMPLETED`.
   * - **Organización:** es la dueña del recurso de agenda en el que se reservó
   *   la cita de esa atención. Las 763 prácticas de los entornos desplegados
   *   comparten un solo tenant (medido el 2026-10-08), así que el `tenant_id`
   *   del encuentro no distingue organizaciones.
   *
   * @param em - Transacción activa.
   * @param encuentro - La atención.
   * @param party - La parte.
   * @returns `true` si estuvo.
   */
  private async wasInEncounter(
    em: EntityManager,
    encuentro: Encounters,
    party: RatingParty,
  ): Promise<boolean> {
    if (party.type === 'PATIENT') {
      return encuentro.patientProfileId === party.id;
    }
    if (party.type === 'PRACTITIONER') {
      if (encuentro.primaryPractitionerId === party.id) return true;
      const participo = await em.findOne(EncounterParticipants, {
        encounterId: encuentro.id,
        practitionerProfileId: party.id,
      });
      return participo !== null;
    }
    return (await this.practiceOfEncounter(em, encuentro)) === party.id;
  }

  /**
   * La organización de una atención: atención → cita → reserva → recurso de
   * agenda → práctica.
   *
   * @param em - Transacción activa.
   * @param encuentro - La atención.
   * @returns El id de la práctica, o `undefined` si la atención no salió de una
   *   reserva con recurso de una organización.
   */
  private async practiceOfEncounter(
    em: EntityManager,
    encuentro: Encounters,
  ): Promise<string | undefined> {
    if (!encuentro.appointmentId) return undefined;
    const reserva = await em.findOne(
      AppointmentBookings,
      { appointmentId: encuentro.appointmentId },
      { fields: ['id', 'resourceId'] },
    );
    if (!reserva?.resourceId) return undefined;
    const recurso = await em.findOne(
      SchedulableResources,
      { id: reserva.resourceId },
      { fields: ['id', 'practiceId'] },
    );
    return recurso?.practiceId ?? undefined;
  }

  /**
   * Nadie se califica a sí mismo: el médico que administra su propio
   * consultorio no califica a su organización, ni la organización a su propio
   * administrador.
   *
   * @param em - Transacción activa.
   * @param practitioner - La parte médica del par.
   * @param organization - La parte organización del par.
   * @param actor - La sesión.
   * @throws ForbiddenException si la sesión está en los dos lados.
   */
  private async assertNotSelf(
    em: EntityManager,
    practitioner: RatingParty,
    organization: RatingParty,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.practitionerProfileId !== practitioner.id) return;
    if (await this.parties.administers(em, organization.id, actor)) {
      throw new ForbiddenException(
        'No puede calificar a una organización que usted administra',
      );
    }
  }

  /**
   * El vínculo existe, une a ese médico con esa organización y no fue una
   * solicitud pendiente o rechazada.
   *
   * @param em - Transacción activa.
   * @param roleAssignmentId - Vínculo declarado.
   * @param practitionerProfileId - El médico del par.
   * @param practiceId - La organización del par.
   * @throws PreconditionFailedException si no habilita.
   */
  private async assertRoleAssignment(
    em: EntityManager,
    roleAssignmentId: string,
    practitionerProfileId: string,
    practiceId: string,
  ): Promise<void> {
    const vinculo = await em.findOne(PractitionerRoleAssignments, {
      id: roleAssignmentId,
    });
    const habilita =
      vinculo !== null &&
      vinculo.practitionerProfileId === practitionerProfileId &&
      vinculo.practiceId === practiceId &&
      QUALIFYING_ROLE_STATUSES.includes(vinculo.statusConceptId);
    if (!habilita) {
      throw new PreconditionFailedException(BASIS_REJECTED, {
        roleAssignmentId,
      });
    }
  }
}

/**
 * Exige que el par sea de los que se califican.
 *
 * @param reviewer - Quién califica.
 * @param target - A quién.
 * @throws ForbiddenException si el par no se califica.
 */
function assertPairAllowed(reviewer: RatingParty, target: RatingParty): void {
  if (!ALLOWED_TARGETS[reviewer.type].includes(target.type)) {
    throw new ForbiddenException('Ese tipo de calificación no está habilitado');
  }
}
