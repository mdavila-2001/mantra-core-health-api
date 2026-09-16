import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfilesRepository, ReviewsRepository } from '../repositories';
import { EncountersRepository } from '../../clinical/repositories';
import { EncounterParticipants } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { COMM, REVIEW_DIMENSION_BY_CODE } from '../community.concepts';
import {
  CreateReviewDto,
  CreateReviewResponseDto,
  IdResponseDto,
  ReviewResponseDto,
} from '../dto';
import { CommunityVisibilityService } from './community-visibility.service';

/**
 * Reviews verificadas de servicio (UC-19-11).
 *
 * ## La elegibilidad es del servidor, y antes no existía
 *
 * El endpoint recibía `reviewerPatientProfileId` y `verifiedEncounterId` en el
 * cuerpo y **no comprobaba ninguno de los dos**. Eso quería decir tres cosas, y
 * las tres son graves:
 *
 * 1. Cualquier sesión podía escribir una reseña **firmando como otro paciente**.
 * 2. El `verifiedEncounterId` no se leía: bastaba mandar un uuid cualquiera —de
 *    un encuentro ajeno, o inexistente— para que la reseña saliera con el sello
 *    de «paciente verificado». **El sello era autodeclarado.**
 * 3. Nadie comprobaba que la atención existiera, fuera de ese paciente, fuera
 *    con ese profesional, ni que estuviera terminada. Se podía reseñar una cita
 *    futura, o una de otra persona.
 *
 * El carril lo dice sin rodeos: si el backend no valida la elegibilidad, esto es
 * un hueco crítico, y **no basta con esconder el botón en el frontend**.
 *
 * Ahora el reseñador **no llega en el cuerpo**: sale de `pid`, el claim de
 * perfil de paciente del token. Y el encuentro se lee de `clinical.encounters`
 * para exigir que sea de ese paciente, con ese profesional, y `ENC_FINISHED`.
 *
 * ## Sigue sin exponerse el `verified_encounter_id`
 *
 * Se guarda porque es lo que ata la reseña a una atención real, pero la cara de
 * lectura lo descarta: publicarlo diría que esa persona se atendió, ese día, con
 * ese profesional.
 */
@Injectable()
export class CommunityReviewsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profilesRepo - Valor de profiles repo requerido por la operación.
   * @param reviewsRepo - Valor de reviews repo requerido por la operación.
   * @param encountersRepo - Atenciones clínicas, que respaldan la elegibilidad.
   * @param visibility - Propiedad del perfil con el que se firma la respuesta.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityReviewsService.name);
  }

  /**
   * Exige que la atención respalde la reseña.
   *
   * Las cuatro condiciones y por qué cada una:
   *
   * - **Existe.** Un uuid inventado daba una reseña «verificada» sin nada
   *   detrás.
   * - **Es de este paciente.** Si no, se puede reseñar la atención de otro.
   * - **Fue con este profesional.** Si no, una atención con cualquiera habilita
   *   a calificar a cualquiera.
   * - **Está terminada** (`ENC_FINISHED`). Calificar una atención que todavía no
   *   ocurrió —o que está en curso— no califica nada.
   *
   * El profesional se contrasta contra `primary_practitioner_id` **o** contra
   * los participantes del encuentro: en una atención con equipo, quien atendió
   * de verdad puede no ser el responsable declarado, y exigir sólo el primero
   * dejaría sin poder calificar a la mitad de los profesionales que sí
   * atendieron.
   *
   * Sólo aplica a vitrinas de profesional. Una vitrina de organización o de
   * farmacia no se cuelga de un encuentro, y hasta que producto defina qué
   * atención la respalda, **no se puede reseñar** — que es más honesto que
   * aceptar la reseña sin respaldo.
   *
   * @param em - Transacción activa.
   * @param encounterId - Atención declarada.
   * @param patientProfileId - Paciente que reseña, resuelto del token.
   * @param targetSubjectId - Sujeto de la vitrina calificada.
   * @throws PreconditionFailedException si la atención no habilita la reseña.
   */
  private async assertAtencionElegible(
    em: EntityManager,
    encounterId: string,
    patientProfileId: string,
    targetSubjectId: string,
  ): Promise<void> {
    const encuentro = await this.encountersRepo.findById(em, encounterId);
    if (!encuentro) {
      // El mismo mensaje que los demás casos: decir «ese encuentro no existe»
      // le confirmaría a quien prueba uuids cuáles sí existen.
      throw new PreconditionFailedException(
        'La atención declarada no habilita una reseña',
        { encounterId },
      );
    }
    if (encuentro.patientProfileId !== patientProfileId) {
      throw new PreconditionFailedException(
        'La atención declarada no habilita una reseña',
        { encounterId },
      );
    }
    if (encuentro.statusConceptId !== CLIN.ENCOUNTER_FINISHED) {
      throw new PreconditionFailedException('La atención todavía no terminó', {
        encounterId,
      });
    }

    // Se consulta la entidad de participantes directamente y **sin filtrar por
    // estado**: en un encuentro terminado los participantes quedan en
    // `PART_COMPLETED`, así que el listado de «participantes activos» del módulo
    // clínico devolvería vacío justo en el único caso que habilita una reseña.
    const participo =
      (await em.findOne(EncounterParticipants, {
        encounterId,
        practitionerProfileId: targetSubjectId,
      })) !== null;
    const atendio =
      encuentro.primaryPractitionerId === targetSubjectId || participo;
    if (!atendio) {
      throw new PreconditionFailedException(
        'La atención declarada no fue con este profesional',
        { encounterId },
      );
    }
  }

  /**
   * Califico la atención que recibí, nombrándola por el **encuentro** y no por
   * la vitrina del profesional (C.2).
   *
   * ## Por qué hace falta si `publishReview` ya existe
   *
   * Porque el paciente no conoce —ni tiene por qué conocer— el uuid de la
   * vitrina que va a calificar. La ficha pública se abre por slug y **no
   * publica su id**: un identificador interno regalado a un anónimo no se
   * vuelve a esconder. Sin esta ruta, la única forma de calificar desde la
   * ficha era que la lectura pública filtrara ese uuid, que es exactamente lo
   * que no hace.
   *
   * ## No es una segunda implementación de la regla
   *
   * Acá sólo se **resuelve el destinatario**: del encuentro sale el
   * profesional que atendió y de él su vitrina. Todo lo demás —que la atención
   * sea de quien reseña, que haya terminado, que la haya atendido ese
   * profesional y que no haya reseñado ya ese encuentro— lo sigue comprobando
   * `publishReview`, en un solo lugar.
   *
   * ## El error no confirma nada
   *
   * Un encuentro que no existe, uno sin profesional y uno cuyo profesional no
   * tiene vitrina dan **el mismo** mensaje que una atención ajena. Distinguirlos
   * le confirmaría a quien prueba uuids cuáles sí existen, que es justo lo que
   * `assertAtencionElegible` evita con el mismo texto.
   *
   * @param dto - La atención, las estrellas, el texto y cómo quiere firmar.
   * @param actor - El paciente autenticado.
   * @returns El id de la reseña y si quedó verificada.
   * @throws PreconditionFailedException si la atención no habilita una reseña.
   */
  async publishOwnReview(
    dto: CreateReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    const target = await this.resolveTargetOfEncounter(dto.verifiedEncounterId);
    return this.publishReview(target, dto, actor);
  }

  /**
   * La vitrina del profesional que atendió ese encuentro.
   *
   * @param encounterId - La atención declarada.
   * @returns El identificador del perfil público a calificar.
   * @throws PreconditionFailedException si no se puede resolver, con el mismo
   *   mensaje que cualquier otro motivo de rechazo.
   */
  private async resolveTargetOfEncounter(encounterId: string): Promise<string> {
    const em = this.em.fork();
    const encuentro = await this.encountersRepo.findById(em, encounterId);
    const practitionerId = encuentro?.primaryPractitionerId;
    const vitrina = practitionerId
      ? await this.profilesRepo.findByTarget(em, practitionerId)
      : null;
    if (!vitrina) {
      throw new PreconditionFailedException(
        'La atención declarada no habilita una reseña',
        { encounterId },
      );
    }
    return vitrina.id;
  }

  /** UC-19-11: publica una review verificada con puntuaciones por dimensión. */
  async publishReview(
    profileId: string,
    dto: CreateReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    this.logger.info(
      { operation: 'community.review.publish', profileId },
      'Publishing service review',
    );
    return this.em.transactional(async (tx) => {
      const target = await this.profilesRepo.findById(tx, profileId);
      if (!target)
        throw new ResourceNotFoundException('Perfil objetivo no encontrado', {
          profileId,
        });
      if (target.acceptsReviews === false) {
        throw new PreconditionFailedException('El perfil no acepta reviews', {
          profileId,
        });
      }

      // Quién reseña lo dice el token, no el cuerpo. Una sesión sin perfil de
      // paciente no puede reseñar: no hay atención que la respalde.
      const reviewerPatientProfileId = actor.patientProfileId;
      if (!reviewerPatientProfileId) {
        throw new ForbiddenException(
          'Sólo un paciente con atención registrada puede calificar',
        );
      }

      // La elegibilidad: la atención tiene que existir, ser de este paciente,
      // haber sido con este profesional y estar terminada.
      await this.assertAtencionElegible(
        tx,
        dto.verifiedEncounterId,
        reviewerPatientProfileId,
        target.targetId,
      );

      const existing = await this.reviewsRepo.findByReviewerEncounter(
        tx,
        reviewerPatientProfileId,
        profileId,
        dto.verifiedEncounterId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una review verificada para este encuentro',
          {
            profileId,
          },
        );
      }

      // Una reseña sólo existe si hay atención verificada detrás; ya no hay
      // camino para crear una «no verificada».
      const verified = true;
      const review = this.reviewsRepo.create(tx, {
        targetPublicProfileId: profileId,
        reviewerPatientProfileId,
        verifiedEncounterId: dto.verifiedEncounterId,
        overallRating: dto.overallRating,
        reviewText: dto.reviewText,
        reviewerDisplayModeConceptId:
          dto.displayMode === 'ANONYMOUS'
            ? COMM.REVIEW_DISPLAY_ANONYMOUS
            : COMM.REVIEW_DISPLAY_REAL_NAME,
        verificationStatusConceptId: verified
          ? COMM.REVIEW_VERIFIED
          : COMM.REVIEW_UNVERIFIED,
        moderationStatusConceptId: COMM.MODERATION_PENDING,
        publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
        publishedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      let dimensionCount = 0;
      for (const d of dto.dimensions ?? []) {
        this.reviewsRepo.createDimensionScore(
          tx,
          review.id,
          REVIEW_DIMENSION_BY_CODE[d.dimension],
          d.score,
        );
        dimensionCount++;
      }

      return {
        id: review.id,
        overallRating: review.overallRating,
        verified,
        dimensionCount,
      };
    });
  }

  /**
   * El profesional contesta una reseña sobre su propia vitrina.
   *
   * `community.review_responses` existía como tabla y la lectura ya las
   * devolvía, pero **no había endpoint para crearlas**: un profesional podía ser
   * calificado en público y no tenía forma de contestar.
   *
   * ## Quién puede contestar
   *
   * Sólo el titular de la vitrina calificada. No el que la moderó, no otro
   * profesional, no un administrador: una respuesta aparece firmada por el
   * profesional, y firmarla por él es ponerle palabras en la boca en la ficha
   * pública que lo representa.
   *
   * ## Una respuesta por reseña
   *
   * No es una conversación. Si el profesional quiere decir otra cosa, edita la
   * suya — y hasta que exista la edición, el 409 le dice que ya contestó, que es
   * mejor que dejarle publicar tres respuestas seguidas debajo de una reseña.
   *
   * @param profileId - Vitrina calificada.
   * @param reviewId - Reseña contestada.
   * @param dto - Texto de la respuesta.
   * @param actor - Quien contesta; tiene que ser el titular de la vitrina.
   * @returns El identificador de la respuesta.
   * @throws ResourceNotFoundException si la reseña no existe o no es de esa vitrina.
   * @throws ForbiddenException si la vitrina no es del actor.
   * @throws ConflictException si ya había contestado.
   */
  async respondToReview(
    profileId: string,
    reviewId: string,
    dto: CreateReviewResponseDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'community.review.respond', profileId, reviewId },
      'Responding to service review',
    );
    return this.em.transactional(async (tx) => {
      const target = await this.profilesRepo.findById(tx, profileId);
      if (!target)
        throw new ResourceNotFoundException('Perfil objetivo no encontrado', {
          profileId,
        });

      // Titularidad estricta, sin atajo de rol: ver la reseña ajena es una cosa
      // —trabajo de un moderador—, contestarla en nombre de otro es otra, y no
      // lo es de nadie. La regla es la misma que gobierna toda escritura del
      // grafo social, así que se usa la compartida y no una copia.
      await this.visibility.assertActsAsProfile(tx, profileId, actor);

      const review = await this.reviewsRepo.findById(tx, reviewId);
      // «No es de esta vitrina» y «no existe» dan lo mismo: distinguirlos
      // confirmaría la existencia de reseñas de otros perfiles.
      if (!review || review.targetPublicProfileId !== profileId) {
        throw new ResourceNotFoundException('Reseña no encontrada', {
          reviewId,
        });
      }

      const previa = await this.reviewsRepo.findResponseByResponder(
        tx,
        reviewId,
        profileId,
      );
      if (previa) {
        throw new ConflictException('Ya respondiste esta reseña', { reviewId });
      }

      const respuesta = this.reviewsRepo.createResponse(tx, {
        reviewId,
        responderPublicProfileId: profileId,
        responseText: dto.responseText,
        moderationStatusConceptId: COMM.MODERATION_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();

      return { id: respuesta.id };
    });
  }
}
