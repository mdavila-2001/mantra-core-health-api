import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  ConfirmVisitRecordDto,
  CreateVisitRecordDto,
  CreatedResourceDto,
  RateVisitDto,
  TransitionResultDto,
} from '../dto';
import type { VisitRatings, VisitRecords } from '../entities';
import {
  CatalogRepository,
  SurveysRepository,
  VisitorsRepository,
  VisitsRepository,
} from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';

/** Promedio por dimensión de las calificaciones internas de un laboratorio. */
export interface RatingAggregate {
  /** Cuántas calificaciones se promediaron. */
  sampleSize: number;
  /** Promedio de puntualidad, o `null` si nadie la calificó. */
  punctuality: number | null;
  /** Promedio de calidad de la información. */
  informationQuality: number | null;
  /** Promedio de claridad. */
  clarity: number | null;
  /** Promedio de relevancia. */
  relevance: number | null;
  /** Promedio de conducta profesional. */
  professionalConduct: number | null;
  /** Promedio de utilidad del material. */
  materialUsefulness: number | null;
  /** Promedio de satisfacción general. */
  overallSatisfaction: number | null;
}

/**
 * UC-17-18 a UC-17-20: registro, confirmación y calificación de la visita
 * (spec 5483-5524).
 *
 * El registro lo crea el visitador y lo confirma el doctor. La calificación solo
 * existe sobre una visita **completada** (5509), y la organización nunca ve
 * calificaciones individuales: solo el agregado (5523), que es lo que impide que
 * la nota de un doctor concreto se use como palanca sobre él.
 */
@Injectable()
export class VisitRecordsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de visitas.
   * @param visitorsRepo - Repositorio de visitadores.
   * @param catalog - Repositorio del catálogo, para validar el material.
   * @param surveys - Repositorio de encuestas, para emitir la que corresponda.
   * @param access - Comprobaciones de vinculación y estado.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: VisitsRepository,
    private readonly visitorsRepo: VisitorsRepository,
    private readonly catalog: CatalogRepository,
    private readonly surveys: SurveysRepository,
    private readonly access: PharmaLabAccessService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VisitRecordsService.name);
  }

  /**
   * UC-17-18: el visitador registra la visita realizada.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Visitador autenticado.
   * @returns Identificador del registro.
   * @throws PreconditionFailedException si la visita no estaba confirmada o si
   *   algún material no está aprobado y vigente.
   * @throws ConflictException si la visita ya fue registrada.
   */
  async createRecord(
    dto: CreateVisitRecordDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { visitor, lab } = await this.access.requireOperatingVisitor(
        tx,
        actor,
      );
      const request = await this.repo.findRequest(tx, dto.visitRequestId);
      if (!request || request.medicalVisitorId !== visitor.id) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          visitRequestId: dto.visitRequestId,
        });
      }
      if (
        request.statusConceptId !== PHL.VISIT_CONFIRMED &&
        request.statusConceptId !== PHL.VISIT_IN_PROGRESS
      ) {
        throw new PreconditionFailedException(
          'Solo se registra una visita confirmada',
          { visitRequestId: request.id },
        );
      }
      const already = await this.repo.findRecordByRequest(tx, request.id);
      if (already) {
        throw new ConflictException('La visita ya fue registrada', {
          visitRequestId: request.id,
          visitRecordId: already.id,
        });
      }

      const materials = await this.resolveApprovedMaterials(
        tx,
        lab.id,
        dto.materials ?? [],
        new Date(dto.occurredAt),
      );

      const attended =
        dto.visitorAttendanceConceptId === PHL.ATTENDANCE_ATTENDED &&
        dto.doctorAttendanceConceptId === PHL.ATTENDANCE_ATTENDED;

      const record = this.repo.createRecord(tx, {
        visitRequestId: request.id,
        doctorUserId: request.doctorUserId,
        medicalVisitorId: visitor.id,
        pharmaLabId: lab.id,
        occurredAt: new Date(dto.occurredAt),
        location: dto.location ?? request.location,
        modalityConceptId: request.modalityConceptId,
        topicsDiscussed: dto.topicsDiscussed,
        questions: dto.questions,
        commitments: dto.commitments,
        nextAction: dto.nextAction,
        observations: dto.observations,
        visitorAttendanceConceptId: dto.visitorAttendanceConceptId,
        doctorAttendanceConceptId: dto.doctorAttendanceConceptId,
        confirmationConceptId: PHL.RECORD_PENDING_DOCTOR_CONFIRMATION,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const material of materials) {
        this.repo.createRecordMaterial(tx, {
          visitRecordId: record.id,
          informationalMaterialId: material.id,
          materialVersion: material.version,
          wasHandedOver: material.wasHandedOver,
          actorUserId: actor.id,
        });
      }

      // El estado de la solicitud sigue la asistencia declarada: la spec tiene
      // estados propios para la inasistencia de cada parte y perderlos haría
      // indistinguible «no vino» de «se completó».
      const previous = request.statusConceptId;
      request.statusConceptId = attended
        ? PHL.VISIT_COMPLETED
        : dto.visitorAttendanceConceptId === PHL.ATTENDANCE_MISSED
          ? PHL.VISIT_VISITOR_NO_SHOW
          : PHL.VISIT_DOCTOR_NO_SHOW;
      request.closedAt = new Date();
      touch(request, actor.id);
      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: PHL.VISIT_COMPLETED,
        previousStatusConceptId: previous,
        newStatusConceptId: request.statusConceptId,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });

      this.notifications.notify(
        tx,
        {
          recipientUserId: request.doctorUserId,
          templateCode: 'PHARMA_LAB_VISIT_RECORDED',
          subject: 'Registro de visita pendiente de confirmación',
          bodyText:
            'El visitador registró la visita. Confirmá si ocurrió tal como se describe.',
          relatedResourceType: 'visit_record',
          relatedResourceId: record.id,
          tenantId: request.doctorTenantId,
        },
        actor.id,
      );

      if (attended) {
        await this.issueSurveyIfApplicable(tx, record, lab.id, actor);
      }
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_RECORD_CREATED',
        entity: 'visit_records',
        entityId: record.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        { operation: 'pharma_lab.visit.record', visitRecordId: record.id },
        'Visit record created',
      );
      return { id: record.id };
    });
  }

  /**
   * UC-17-19: el doctor confirma que la visita ocurrió.
   *
   * @param visitRecordId - Registro de visita.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado de confirmación resultante.
   */
  async confirmRecord(
    visitRecordId: string,
    dto: ConfirmVisitRecordDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const record = await this.requireDoctorRecord(tx, visitRecordId, actor);
      if (
        record.confirmationConceptId !== PHL.RECORD_PENDING_DOCTOR_CONFIRMATION
      ) {
        throw new ConflictException('El registro ya fue resuelto', {
          visitRecordId,
        });
      }
      record.confirmationConceptId = dto.occurred
        ? PHL.RECORD_CONFIRMED
        : PHL.RECORD_DISPUTED;
      record.confirmedAt = new Date();
      if (dto.note) {
        record.observations = [record.observations, `Doctor: ${dto.note}`]
          .filter(Boolean)
          .join('\n');
      }
      touch(record, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: dto.occurred
          ? 'VISIT_RECORD_CONFIRMED'
          : 'VISIT_RECORD_DISPUTED',
        entity: 'visit_records',
        entityId: record.id,
      });
      return { id: record.id, statusConceptId: record.confirmationConceptId };
    });
  }

  /**
   * UC-17-20: el doctor califica la visita.
   *
   * @param visitRecordId - Registro de visita.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador de la calificación.
   * @throws PreconditionFailedException si la visita no está completada.
   * @throws ConflictException si ya existe una calificación de esa naturaleza.
   */
  async rateVisit(
    visitRecordId: string,
    dto: RateVisitDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const record = await this.requireDoctorRecord(tx, visitRecordId, actor);
      const request = await this.repo.findRequest(tx, record.visitRequestId);
      if (!request || request.statusConceptId !== PHL.VISIT_COMPLETED) {
        throw new PreconditionFailedException(
          'Solo se califica una visita completada',
          { visitRecordId },
        );
      }
      const clash = await this.repo.findRating(
        tx,
        record.id,
        dto.kindConceptId,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una calificación de esa naturaleza para la visita',
          { visitRecordId },
        );
      }

      const rating = this.repo.createRating(tx, {
        visitRecordId: record.id,
        doctorUserId: actor.id,
        kindConceptId: dto.kindConceptId,
        punctuality: dto.punctuality,
        informationQuality: dto.informationQuality,
        clarity: dto.clarity,
        relevance: dto.relevance,
        professionalConduct: dto.professionalConduct,
        materialUsefulness: dto.materialUsefulness,
        overallSatisfaction: dto.overallSatisfaction,
        comment: dto.comment,
        actorUserId: actor.id,
      });
      await tx.flush();

      // La calificación no se publica (spec 5524). Lo único que sale del ámbito
      // del doctor es el aviso de que hay una nueva, sin su contenido.
      const visitor = await this.visitorsRepo.findVisitor(
        tx,
        record.medicalVisitorId,
      );
      if (visitor && dto.kindConceptId === PHL.RATING_INTERNAL) {
        this.notifications.notify(
          tx,
          {
            recipientUserId: visitor.userId,
            templateCode: 'PHARMA_LAB_VISIT_RATED',
            subject: 'El doctor calificó una visita',
            bodyText:
              'Los resultados se consultan de forma agregada desde el laboratorio.',
            relatedResourceType: 'visit_record',
            relatedResourceId: record.id,
          },
          actor.id,
        );
        await tx.flush();
      }

      await this.audit.record(tx, actor, {
        action: 'VISIT_RATED',
        entity: 'visit_ratings',
        entityId: rating.id,
      });
      return { id: rating.id };
    });
  }

  /**
   * Lista el historial de visitas de un laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Registros del más reciente al más antiguo.
   */
  async listLabRecords(pharmaLabId: string): Promise<VisitRecords[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listRecordsByLab(this.em, pharmaLabId);
  }

  /**
   * Lista las visitas recibidas por el doctor autenticado.
   *
   * @param actor - Doctor autenticado.
   * @returns Registros del más reciente al más antiguo.
   */
  listDoctorRecords(actor: AuthenticatedUser): Promise<VisitRecords[]> {
    return this.repo.listRecordsByDoctor(this.em, actor.id);
  }

  /**
   * Resultados agregados de las calificaciones de un laboratorio (spec 5523).
   *
   * Devuelve promedios, nunca filas: la organización no puede reconstruir qué
   * puso cada doctor.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Promedios por dimensión y tamaño de la muestra.
   */
  async getRatingAggregate(pharmaLabId: string): Promise<RatingAggregate> {
    await this.access.requireLab(this.em, pharmaLabId);
    const records = await this.repo.listRecordsByLab(this.em, pharmaLabId);
    const ratings = await this.repo.listInternalRatings(
      this.em,
      records.map((record) => record.id),
    );
    return {
      sampleSize: ratings.length,
      punctuality: average(ratings, (r) => r.punctuality),
      informationQuality: average(ratings, (r) => r.informationQuality),
      clarity: average(ratings, (r) => r.clarity),
      relevance: average(ratings, (r) => r.relevance),
      professionalConduct: average(ratings, (r) => r.professionalConduct),
      materialUsefulness: average(ratings, (r) => r.materialUsefulness),
      overallSatisfaction: average(ratings, (r) => r.overallSatisfaction),
    };
  }

  private async requireDoctorRecord(
    tx: EntityManager,
    visitRecordId: string,
    actor: AuthenticatedUser,
  ): Promise<VisitRecords> {
    const record = await this.repo.findRecord(tx, visitRecordId);
    if (!record || record.doctorUserId !== actor.id) {
      throw new ResourceNotFoundException('Registro de visita no encontrado', {
        visitRecordId,
      });
    }
    return record;
  }

  /**
   * Comprueba que cada material declarado está aprobado y vigente en la fecha de
   * la visita, y devuelve su versión para dejarla congelada en la evidencia.
   */
  private async resolveApprovedMaterials(
    tx: EntityManager,
    pharmaLabId: string,
    declared: NonNullable<CreateVisitRecordDto['materials']>,
    occurredAt: Date,
  ): Promise<{ id: string; version: string; wasHandedOver: boolean }[]> {
    if (declared.length === 0) return [];
    const ids = declared.map((item) => item.informationalMaterialId);
    const materials = await this.catalog.findMaterialsByIds(tx, ids);
    const byId = new Map(materials.map((material) => [material.id, material]));
    const on = occurredAt.toISOString().slice(0, 10);

    return declared.map((item) => {
      const material = byId.get(item.informationalMaterialId);
      if (!material || material.pharmaLabId !== pharmaLabId) {
        throw new ResourceNotFoundException(
          'Material informativo no encontrado en el laboratorio',
          { informationalMaterialId: item.informationalMaterialId },
        );
      }
      if (material.statusConceptId !== PHL.MATERIAL_APPROVED) {
        throw new PreconditionFailedException(
          'Un visitador no puede compartir material que no está aprobado',
          { informationalMaterialId: material.id },
        );
      }
      if (
        (material.validFrom && material.validFrom > on) ||
        (material.validTo && material.validTo < on)
      ) {
        throw new PreconditionFailedException(
          'El material no estaba vigente en la fecha de la visita',
          { informationalMaterialId: material.id },
        );
      }
      return {
        id: material.id,
        version: material.version,
        wasHandedOver: item.wasHandedOver ?? false,
      };
    });
  }

  /**
   * Emite la encuesta post-visita que corresponda, si el laboratorio configuró
   * alguna vigente para esa visita.
   */
  private async issueSurveyIfApplicable(
    tx: EntityManager,
    record: VisitRecords,
    pharmaLabId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const survey = await this.surveys.findApplicableSurvey(
      tx,
      pharmaLabId,
      record.medicalVisitorId,
      record.occurredAt.toISOString().slice(0, 10),
    );
    if (!survey) return;

    this.surveys.createResponse(tx, {
      visitSurveyId: survey.id,
      visitRecordId: record.id,
      doctorUserId: record.doctorUserId,
      statusConceptId: PHL.RESPONSE_PENDING,
      issuedAt: new Date(
        record.occurredAt.getTime() + survey.sendDelayHours * 3_600_000,
      ),
      actorUserId: actor.id,
    });
    this.notifications.notify(
      tx,
      {
        recipientUserId: record.doctorUserId,
        templateCode: 'PHARMA_LAB_SURVEY_ISSUED',
        subject: 'Encuesta sobre la visita médica',
        bodyText: survey.title,
        relatedResourceType: 'visit_record',
        relatedResourceId: record.id,
      },
      actor.id,
    );
  }
}

/** Promedio de una dimensión, redondeado a dos decimales, o `null` si nadie la puntuó. */
function average(
  ratings: readonly VisitRatings[],
  pick: (rating: VisitRatings) => number | undefined,
): number | null {
  const values = ratings
    .map(pick)
    .filter((value): value is number => typeof value === 'number');
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
