import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CareRelationshipsRepository,
  PatientLegalRepresentationsRepository,
} from '../repositories';
import { AuditTrailService } from '../../audit/services';
import { NotificationsService, OutboxService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/repositories';
import { Persons } from '../../profiles/entities';
import {
  CreateCareRelationshipDto,
  CreateLegalRepresentationDto,
  RequestCareRelationshipDto,
  RespondCareRelationshipDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
  CareRelationshipView,
  LegalRepresentationView,
  type CareRelationshipType,
  type CareRelationshipPurpose,
  type LegalRepresentationType,
} from '../dto';
import { AUTHZ } from '../authz.concepts';

const CARE_REL_TYPE_CONCEPT: Record<CareRelationshipType, string> = {
  TREATING: AUTHZ.CARE_REL_TREATING,
  CONSULTING: AUTHZ.CARE_REL_CONSULTING,
  EMERGENCY: AUTHZ.CARE_REL_EMERGENCY,
};

const CARE_REL_PURPOSE_CONCEPT: Record<CareRelationshipPurpose, string> = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
  EMERGENCY: AUTHZ.PURPOSE_EMERGENCY,
};

const REPRESENTATION_TYPE_CONCEPT: Record<LegalRepresentationType, string> = {
  LEGAL_GUARDIAN: AUTHZ.REPRESENTATION_LEGAL_GUARDIAN,
  PARENT: AUTHZ.REPRESENTATION_PARENT,
  ATTORNEY: AUTHZ.REPRESENTATION_ATTORNEY,
  CURATOR: AUTHZ.REPRESENTATION_CURATOR,
};

/**
 * Relación asistencial (C-06 / CAN-AUTH-001) y representación legal del paciente
 * (C-07 / A-03). Estos vínculos son bases legítimas de acceso a los datos del
 * paciente que evalúa el PDP, además de `clinical_access_grants`. La revocación
 * NUNCA borra: cambia el estado y cierra la vigencia (`valid_to`).
 */
@Injectable()
export class AuthzCareRelationshipsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param careRepo - Valor de care repo requerido por la operación.
   * @param legalRepo - Valor de legal repo requerido por la operación.
   * @param accountLinksRepo - Resuelve el usuario dueño de un perfil de paciente, para notificarlo (FT-07-R05).
   * @param auditTrail - Deja constancia WORM de la solicitud/respuesta.
   * @param notifications - Emite el aviso in-app al paciente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly careRepo: CareRelationshipsRepository,
    private readonly legalRepo: PatientLegalRepresentationsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly outbox: OutboxService,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzCareRelationshipsService.name);
  }

  /**
   * FT-07-R05: un practicante que encontró al paciente por búsqueda pide
   * autorización para verlo — no queda ninguna relación ACTIVA hasta que el
   * paciente responda. Notifica al titular; no lanza si la notificación
   * falla (`emitInApp` ya absorbe ese error).
   */
  async requestCareRelationship(
    dto: RequestCareRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'Sólo un practicante con perfil propio puede solicitar acceso a un expediente',
        {},
      );
    }
    const practitionerProfileId = actor.practitionerProfileId;
    this.logger.info(
      {
        operation: 'authz.care-relationship.request',
        patientProfileId: dto.patientProfileId,
        practitionerProfileId,
      },
      'Requesting care relationship',
    );

    const { relId, tenantId } = await this.em.transactional(async (tx) => {
      const activa = await this.careRepo.findActive(
        tx,
        dto.patientProfileId,
        practitionerProfileId,
      );
      if (activa) {
        throw new ConflictException(
          'Ya existe una relación asistencial activa con ese paciente',
          { patientProfileId: dto.patientProfileId, practitionerProfileId },
        );
      }
      const pendiente = await this.careRepo.findPending(
        tx,
        dto.patientProfileId,
        practitionerProfileId,
      );
      if (pendiente) {
        throw new ConflictException(
          'Ya hay una solicitud pendiente de respuesta para ese paciente',
          { patientProfileId: dto.patientProfileId, practitionerProfileId },
        );
      }

      const rel = this.careRepo.create(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        practitionerProfileId,
        relationshipTypeConceptId:
          CARE_REL_TYPE_CONCEPT[dto.relationshipType ?? 'TREATING'],
        validFrom: new Date(),
        actorUserId: actor.id,
        statusConceptId: CONCEPTS.STATE_PENDING,
      });
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'CARE_RELATIONSHIP_REQUESTED',
        entity: 'care_relationship',
        entityId: rel.id,
        tenantId: dto.tenantId,
      });

      return { relId: rel.id, tenantId: dto.tenantId };
    });

    const recipientUserId = await this.resolvePatientUserId(
      dto.patientProfileId,
    );
    if (recipientUserId) {
      await this.notifications.emitInApp({
        recipientUserId,
        category: 'CLINICAL',
        subject: 'Un profesional pide ver tu historia clínica',
        bodyText:
          dto.reasonText ??
          'Un profesional te encontró en la red y pide tu autorización para ver tu expediente. Podés elegir qué áreas autorizar, o rechazarlo.',
        destination: { type: 'CARE_RELATIONSHIP_REQUEST', id: relId },
        tenantId,
        actorUserId: actor.id,
      });
    } else {
      this.logger.warn(
        {
          operation: 'authz.care-relationship.request.notify-missing',
          patientProfileId: dto.patientProfileId,
        },
        'No se encontró cuenta activa del paciente: la solicitud queda creada sin notificación',
      );
    }

    return { id: relId, status: CONCEPTS.STATE_PENDING, createdAt: new Date() };
  }

  /**
   * FT-07-R06/R07: el paciente responde su propia solicitud. `ACCEPT` activa
   * la relación (con las especialidades que el paciente declara autorizar,
   * si las hay); `REJECT` la cierra sin conceder nada. Ambas quedan
   * auditadas.
   */
  async respondToCareRelationshipRequest(
    id: string,
    dto: RespondCareRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      {
        operation: 'authz.care-relationship.respond',
        id,
        decision: dto.decision,
      },
      'Responding to care relationship request',
    );
    return this.em.transactional(async (tx) => {
      const rel = await this.careRepo.findById(tx, id);
      if (!rel) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }
      // Sólo el paciente titular puede responder su propia solicitud — no el
      // practicante que la envió, ni otro paciente que adivine el id.
      if (
        !actor.patientProfileId ||
        actor.patientProfileId !== rel.patientProfileId
      ) {
        throw new PreconditionFailedException(
          'Sólo el paciente titular puede responder esta solicitud',
          { id },
        );
      }
      if (rel.statusConceptId !== CONCEPTS.STATE_PENDING) {
        throw new PreconditionFailedException(
          'La solicitud ya fue respondida o ya no está pendiente',
          { id, status: rel.statusConceptId },
        );
      }

      if (dto.decision === 'ACCEPT') {
        rel.statusConceptId = CONCEPTS.STATE_ACTIVE;
        // `validFrom` se refija al momento de la aceptación: la solicitud pudo
        // quedar pendiente varios días, y la vigencia real de la relación
        // empieza cuando el paciente autoriza, no cuando el practicante pidió.
        rel.validFrom = new Date();
      } else {
        rel.statusConceptId = CONCEPTS.STATE_REVOKED;
        rel.validTo = new Date();
      }
      touch(rel, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action:
          dto.decision === 'ACCEPT'
            ? 'CARE_RELATIONSHIP_ACCEPTED'
            : 'CARE_RELATIONSHIP_REJECTED',
        entity: 'care_relationship',
        entityId: rel.id,
        tenantId: rel.tenantId,
      });

      // El sello WORM de arriba prueba QUÉ pasó y CUÁNDO; el detalle de QUÉ
      // especialidades autorizó exactamente (FT-07-R06) viaja acá, en la misma
      // transacción, porque `care_relationships` no modela ese campo — el
      // dominio ya usa el outbox para el detalle estructurado de una decisión
      // de acceso (ver `AuthzClinicalService.breakTheGlass`).
      await this.outbox.publishDomainEvent(tx, {
        tenantId: rel.tenantId,
        eventType: 'authz.care_relationship.responded',
        aggregateType: 'care_relationship',
        aggregateId: rel.id,
        payloadJson: {
          decision: dto.decision,
          patientProfileId: rel.patientProfileId,
          practitionerProfileId: rel.practitionerProfileId,
          authorizedSpecialtyConceptIds:
            dto.decision === 'ACCEPT'
              ? (dto.authorizedSpecialtyConceptIds ?? [])
              : [],
        },
        actorUserId: actor.id,
      });

      return { ok: true, affected: 1 };
    });
  }

  /** Resuelve el `userId` de la cuenta activa de un perfil de paciente. */
  private async resolvePatientUserId(
    patientProfileId: string,
  ): Promise<string | undefined> {
    const em = this.em.fork();
    // `patient_profiles.profile_id` ES el id de la persona (una persona tiene
    // a lo sumo un perfil de paciente, con la misma clave) — el mismo supuesto
    // que ya usa `ClinicalReadService` para resolver en la otra dirección.
    const link = await this.accountLinksRepo.findActiveByPerson(
      em,
      patientProfileId,
    );
    return link?.userId;
  }

  /** Establece una relación asistencial practicante↔paciente. */
  async establishCareRelationship(
    dto: CreateCareRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.care-relationship.establish',
        patientProfileId: dto.patientProfileId,
        practitionerProfileId: dto.practitionerProfileId,
        relationshipType: dto.relationshipType,
      },
      'Establishing care relationship',
    );
    return this.em.transactional(async (tx) => {
      const validFrom = dto.validFrom ?? new Date();
      if (dto.validTo && dto.validTo <= validFrom) {
        throw new PreconditionFailedException(
          'validTo debe ser posterior a validFrom',
          {},
        );
      }

      const existing = await this.careRepo.findActive(
        tx,
        dto.patientProfileId,
        dto.practitionerProfileId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una relación asistencial activa para ese practicante',
          {
            patientProfileId: dto.patientProfileId,
            practitionerProfileId: dto.practitionerProfileId,
          },
        );
      }

      const rel = this.careRepo.create(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        practitionerProfileId: dto.practitionerProfileId,
        relationshipTypeConceptId: CARE_REL_TYPE_CONCEPT[dto.relationshipType],
        purposeConceptId: dto.purposeOfUse
          ? CARE_REL_PURPOSE_CONCEPT[dto.purposeOfUse]
          : undefined,
        validFrom,
        validTo: dto.validTo,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: rel.id,
        status: CONCEPTS.STATE_ACTIVE,
        createdAt: rel.createdAt,
      };
    });
  }

  /** Revoca (o expira) una relación asistencial activa. NUNCA borra. */
  async revokeCareRelationship(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.care-relationship.revoke', id },
      'Revoking care relationship',
    );
    return this.em.transactional(async (tx) => {
      const rel = await this.careRepo.findById(tx, id);
      if (!rel)
        throw new ResourceNotFoundException(
          'Relación asistencial no encontrada',
          { id },
        );
      if (rel.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La relación asistencial no está activa',
          { id, status: rel.statusConceptId },
        );
      }

      const now = new Date();
      // `valid_to` llega como `null` (no `undefined`) cuando la relación no tiene fin, y
      // `null <= now` es verdadero: una relación abierta se marcaba EXPIRED en vez de
      // REVOKED y su vigencia no se cerraba.
      const expired = rel.validTo != null && rel.validTo <= now;
      rel.statusConceptId = expired
        ? CONCEPTS.STATE_EXPIRED
        : CONCEPTS.STATE_REVOKED;
      if (!expired) rel.validTo = now;
      touch(rel, actor.id);
      await tx.flush();
      return { ok: true, affected: 1 };
    });
  }

  /**
   * FT-07-R06: lo que el paciente logueado tiene pendiente de decidir.
   *
   * Sólo las `PENDING` y sólo las suyas: el sujeto sale de la sesión
   * (`actor.patientProfileId`), nunca de un parámetro, así que un paciente no
   * puede listar la bandeja de otro adivinando un id. Sin perfil de paciente
   * la respuesta es una lista vacía, no un error — el aviso de la campana
   * puede llegar a una cuenta que todavía no completó su alta.
   *
   * @param actor - El paciente que consulta su bandeja.
   */
  async listMyPendingCareRelationshipRequests(
    actor: AuthenticatedUser,
  ): Promise<CareRelationshipView[]> {
    if (!actor.patientProfileId) return [];
    const em = this.em.fork();
    const rows = await this.careRepo.findPendingByPatient(
      em,
      actor.patientProfileId,
    );
    // TX-27: los nombres de todos los profesionales en una sola lectura
    // (`profile_id` es FK directa a `persons.id`), en vez de una ficha por fila.
    const persons =
      rows.length === 0
        ? []
        : await em.find(Persons, {
            id: { $in: [...new Set(rows.map((r) => r.practitionerProfileId))] },
          });
    const nameById = new Map(
      persons.map((p) => [
        p.id,
        p.displayName ?? [p.name, p.lastName].filter(Boolean).join(' '),
      ]),
    );
    return rows.map((r) => ({
      id: r.id,
      patientProfileId: r.patientProfileId,
      practitionerProfileId: r.practitionerProfileId,
      practitionerName: nameById.get(r.practitionerProfileId) || undefined,
      relationshipTypeConceptId: r.relationshipTypeConceptId,
      statusConceptId: r.statusConceptId,
      purposeConceptId: r.purposeConceptId,
      validFrom: r.validFrom,
      validTo: r.validTo,
    }));
  }

  /** Lista las relaciones asistenciales de un paciente (scoping por tenant). */
  async listCareRelationshipsByPatient(
    tenantId: string,
    patientProfileId: string,
  ): Promise<CareRelationshipView[]> {
    const em = this.em.fork();
    const rows = await this.careRepo.findByPatient(
      em,
      tenantId,
      patientProfileId,
    );
    return rows.map((r) => ({
      id: r.id,
      patientProfileId: r.patientProfileId,
      practitionerProfileId: r.practitionerProfileId,
      relationshipTypeConceptId: r.relationshipTypeConceptId,
      statusConceptId: r.statusConceptId,
      purposeConceptId: r.purposeConceptId,
      validFrom: r.validFrom,
      validTo: r.validTo,
    }));
  }

  /** Registra una representación legal del paciente. */
  async establishLegalRepresentation(
    dto: CreateLegalRepresentationDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      {
        operation: 'authz.legal-representation.establish',
        patientProfileId: dto.patientProfileId,
        representativeUserId: dto.representativeUserId,
        representationType: dto.representationType,
      },
      'Establishing legal representation',
    );
    return this.em.transactional(async (tx) => {
      const validFrom = dto.validFrom ?? new Date();
      if (dto.validTo && dto.validTo <= validFrom) {
        throw new PreconditionFailedException(
          'validTo debe ser posterior a validFrom',
          {},
        );
      }

      const existing = await this.legalRepo.findActive(
        tx,
        dto.patientProfileId,
        dto.representativeUserId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una representación legal activa para ese usuario',
          {
            patientProfileId: dto.patientProfileId,
            representativeUserId: dto.representativeUserId,
          },
        );
      }

      const rep = this.legalRepo.create(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        representativeUserId: dto.representativeUserId,
        representationTypeConceptId:
          REPRESENTATION_TYPE_CONCEPT[dto.representationType],
        validFrom,
        validTo: dto.validTo,
        documentRef: dto.documentRef,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: rep.id,
        status: CONCEPTS.STATE_ACTIVE,
        createdAt: rep.createdAt,
      };
    });
  }

  /** Revoca (o expira) una representación legal activa. NUNCA borra. */
  async revokeLegalRepresentation(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.legal-representation.revoke', id },
      'Revoking legal representation',
    );
    return this.em.transactional(async (tx) => {
      const rep = await this.legalRepo.findById(tx, id);
      if (!rep)
        throw new ResourceNotFoundException(
          'Representación legal no encontrada',
          { id },
        );
      if (rep.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La representación legal no está activa',
          { id, status: rep.statusConceptId },
        );
      }

      const now = new Date();
      const expired = rep.validTo !== undefined && rep.validTo <= now;
      rep.statusConceptId = expired
        ? CONCEPTS.STATE_EXPIRED
        : CONCEPTS.STATE_REVOKED;
      if (!expired) rep.validTo = now;
      touch(rep, actor.id);
      await tx.flush();
      return { ok: true, affected: 1 };
    });
  }

  /** Lista las representaciones legales de un paciente (scoping por tenant). */
  async listLegalRepresentationsByPatient(
    tenantId: string,
    patientProfileId: string,
  ): Promise<LegalRepresentationView[]> {
    const em = this.em.fork();
    const rows = await this.legalRepo.findByPatient(
      em,
      tenantId,
      patientProfileId,
    );
    return rows.map((r) => ({
      id: r.id,
      patientProfileId: r.patientProfileId,
      representativeUserId: r.representativeUserId,
      representationTypeConceptId: r.representationTypeConceptId,
      statusConceptId: r.statusConceptId,
      documentRef: r.documentRef,
      validFrom: r.validFrom,
      validTo: r.validTo,
    }));
  }
}
