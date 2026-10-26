import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  getCurrentTenantId,
  PreconditionFailedException,
  roleAuthorizesInTenant,
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
import { PersonAccountLinksRepository } from '../../profiles/infrastructure/repositories';
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
import { AuthzErrorReason } from '../authz.error-reasons';
import { AuthzClinicalScopeService } from './authz-clinical-scope.service';

/** Cómo se informa una relación asistencial inexistente o de otro tenant. */
const CARE_RELATIONSHIP_NOT_FOUND = {
  message: 'Relación asistencial no encontrada',
  reason: AuthzErrorReason.CARE_RELATIONSHIP_NOT_FOUND,
} as const;

/** Cómo se informa una representación legal inexistente o de otro tenant. */
const LEGAL_REPRESENTATION_NOT_FOUND = {
  message: 'Representación legal no encontrada',
  reason: AuthzErrorReason.LEGAL_REPRESENTATION_NOT_FOUND,
} as const;

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
   * @param scope - Política de alcance: tenant del contexto y vínculo del paciente con él.
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
    private readonly scope: AuthzClinicalScopeService,
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
      // El tenant sale del contexto. A diferencia del alta directa, acá el paciente
      // se encontró en el padrón y aún no tiene vínculo con el tenant: alcanza con
      // que exista, porque la relación nace `PENDING` y no concede nada hasta que
      // el propio paciente la acepte.
      const tenantId = this.scope.resolveTenant(dto.tenantId);
      await this.scope.assertPatientExists(tx, dto.patientProfileId);

      // Los duplicados se buscan sólo en el tenant activo: una relación o una
      // solicitud de otra organización no es duplicado de ésta, y un 409 por ella
      // delataría que el vínculo existe allí. Sin `details`: ni ids de vuelta.
      const active = await this.careRepo.findActiveInTenant(
        tx,
        dto.patientProfileId,
        practitionerProfileId,
        tenantId,
      );
      if (active) {
        throw new ConflictException(
          'Ya existe una relación asistencial activa con ese paciente',
        );
      }
      const pending = await this.careRepo.findPendingInTenant(
        tx,
        dto.patientProfileId,
        practitionerProfileId,
        tenantId,
      );
      if (pending) {
        throw new ConflictException(
          'Ya hay una solicitud pendiente de respuesta para ese paciente',
        );
      }

      const rel = this.careRepo.create(tx, {
        tenantId,
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
        tenantId,
      });

      return { relId: rel.id, tenantId };
    });

    const recipientUserId = await this.resolvePatientUserId(
      dto.patientProfileId,
    );
    if (recipientUserId) {
      await this.notifications.emitInApp({
        recipientUserId,
        category: 'CLINICAL',
        subject: 'Un profesional pide ver su historia clínica',
        bodyText:
          dto.reasonText ??
          'Un profesional le encontró en la red y pide su autorización para ver su expediente. Puede elegir qué áreas autorizar, o rechazarlo.',
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

  /**
   * Abre la relación asistencial `ACTIVE` que respalda el cobro del tenant activo
   * por la atención de un paciente, **sólo si el paciente dejó una huella propia en
   * él** (una reserva hecha por su cuenta o su autorregistro: la misma prueba de
   * `assertPatientInTenant`). Así la relación nace de un acto del paciente y no del
   * personal, y no se salta la aceptación que exige `requestCareRelationship`.
   *
   * La relación nace acotada a `PAYMENT`: habilita el cobro con seguro (REQ-16-035)
   * y nada más. No abre la historia clínica (`ClinicalReadService` descarta las
   * relaciones acotadas) ni concede acceso por el PDP a otros propósitos; para eso
   * el profesional la pide y el paciente la acepta.
   *
   * No hace nada —y no lanza— cuando:
   * - el tenant indicado no es el activo;
   * - el actor no es el propio profesional ni `CLINICIAN` (los mismos que pueden dar
   *   de alta una relación directa);
   * - el paciente no tiene huella propia;
   * - ya hay una relación `ACTIVE` con ese profesional en el tenant, o el paciente
   *   ya decidió sobre ella (solicitud `PENDING` sin responder, o relación
   *   `REVOKED`/rechazada): no se la reabre por el check-in.
   *
   * Corre en la transacción del llamador.
   *
   * @param tx - Transacción del llamador (el check-in).
   * @param input - Paciente, profesional que atiende y tenant de la atención.
   * @param actor - Quien registra la atención.
   * @returns `true` si creó la relación; `false` si no correspondía crearla.
   */
  async establishFromPatientFootprint(
    tx: EntityManager,
    input: {
      patientProfileId: string;
      practitionerProfileId: string;
      tenantId: string;
    },
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const { patientProfileId, practitionerProfileId, tenantId } = input;
    if (getCurrentTenantId() !== tenantId) return false;
    const isThePractitioner =
      actor.practitionerProfileId === practitionerProfileId;
    if (
      !isThePractitioner &&
      !roleAuthorizesInTenant(actor, 'CLINICIAN', tenantId)
    ) {
      return false;
    }
    if (
      !(await this.scope.patientHasOwnFootprint(tx, patientProfileId, tenantId))
    ) {
      return false;
    }
    const existing = await this.careRepo.findActiveInTenant(
      tx,
      patientProfileId,
      practitionerProfileId,
      tenantId,
    );
    if (existing) return false;
    if (
      await this.careRepo.hasPendingOrRevokedInTenant(
        tx,
        patientProfileId,
        practitionerProfileId,
        tenantId,
      )
    ) {
      return false;
    }

    const rel = this.careRepo.create(tx, {
      tenantId,
      patientProfileId,
      practitionerProfileId,
      relationshipTypeConceptId: CARE_REL_TYPE_CONCEPT.TREATING,
      purposeConceptId: AUTHZ.PURPOSE_PAYMENT,
      validFrom: new Date(),
      actorUserId: actor.id,
    });
    await tx.flush();
    await this.auditTrail.record(tx, actor, {
      action: 'CARE_RELATIONSHIP_ESTABLISHED_FROM_FOOTPRINT',
      entity: 'care_relationship',
      entityId: rel.id,
      tenantId,
    });
    return true;
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
          AuthzErrorReason.CARE_RELATIONSHIP_INVALID_VALIDITY_WINDOW,
        );
      }

      // El tenant sale del contexto y el paciente tiene que tener vínculo con él
      // antes de leer o persistir nada (un 409 sobre un paciente ajeno lo delataría).
      const tenantId = this.scope.resolveTenant(dto.tenantId);
      await this.scope.assertPatientInTenant(
        tx,
        dto.patientProfileId,
        tenantId,
      );

      // El duplicado se busca sólo en el tenant activo (como en los accesos
      // clínicos): una relación de otra organización no bloquea ésta ni se delata
      // con un 409. La respuesta no lleva `details`: no devuelve ids.
      const existing = await this.careRepo.findActiveInTenant(
        tx,
        dto.patientProfileId,
        dto.practitionerProfileId,
        tenantId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una relación asistencial activa para ese practicante',
          undefined,
          AuthzErrorReason.CARE_RELATIONSHIP_ALREADY_ACTIVE,
        );
      }

      const rel = this.careRepo.create(tx, {
        tenantId,
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
      // Inexistente y de otro tenant responden igual (404 sin `details`). El
      // paciente titular sí revoca lo suyo desde cualquier organización.
      const rel = this.scope.scopeRevocation(
        await this.careRepo.findById(tx, id),
        actor,
        CARE_RELATIONSHIP_NOT_FOUND,
      );
      if (rel.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La relación asistencial no está activa',
          { id, status: rel.statusConceptId },
          AuthzErrorReason.CARE_RELATIONSHIP_NOT_ACTIVE,
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
          AuthzErrorReason.LEGAL_REPRESENTATION_INVALID_VALIDITY_WINDOW,
        );
      }

      const tenantId = this.scope.resolveTenant(dto.tenantId);
      await this.scope.assertPatientInTenant(
        tx,
        dto.patientProfileId,
        tenantId,
      );

      // Sólo en el tenant activo y sin `details`, igual que la relación asistencial.
      const existing = await this.legalRepo.findActiveInTenant(
        tx,
        dto.patientProfileId,
        dto.representativeUserId,
        tenantId,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una representación legal activa para ese usuario',
          undefined,
          AuthzErrorReason.LEGAL_REPRESENTATION_ALREADY_ACTIVE,
        );
      }

      const rep = this.legalRepo.create(tx, {
        tenantId,
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
      const rep = this.scope.scopeRevocation(
        await this.legalRepo.findById(tx, id),
        actor,
        LEGAL_REPRESENTATION_NOT_FOUND,
      );
      if (rep.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La representación legal no está activa',
          { id, status: rep.statusConceptId },
          AuthzErrorReason.LEGAL_REPRESENTATION_NOT_ACTIVE,
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
