import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { composeAccountDisplayName } from '../../profiles/domain/person-name';
import {
  MIN_NATIONAL_ID_LENGTH,
  normalizeNationalId,
} from '../../profiles/domain/national-id';
import {
  PatientDocumentRegisteredException,
  registerPatientRecords,
  type PatientIntakeRepos,
} from '../../profiles/infrastructure/adapters/patient-intake';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../profiles/infrastructure/repositories';
import { OutboxService } from '../../messaging/services/outbox.service';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import { PROF } from '../../profiles/profiles.concepts';
import {
  ADULT_AGE_YEARS,
  ageInYears,
  classifyGuardianRelationship,
  isRealDate,
  type GuardianKind,
} from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  RegisterSupportPatientDto,
  SupportPatientDuplicateDto,
  SupportPatientRegistrationResponseDto,
} from '../dto';
import {
  SupportAccessRepository,
  SupportPatientsRepository,
  type RepresentativeRow,
} from '../repositories';
import { SupportAccessPolicy } from './support-access.policy';
import {
  loadPatientStanding,
  sealInOwnPartition,
} from './support-patient-access';
import {
  resolveNationalId,
  resolveTenantId,
  throttledException,
} from './support-patient-input';
import { SupportPatientProbeCounter } from './support-patient-probe-counter';
import { withTenantContext } from './tenant-context';
import { toDuplicateDto, toMatchDto } from './support-patient-view';

/** Concepto de persona relacionada que corresponde a cada parentesco clasificado. */
const RELATED_CONCEPT_BY_KIND: Readonly<Record<GuardianKind, string>> = {
  MOTHER: PROF.RELATIONSHIP_MOTHER,
  FATHER: PROF.RELATIONSHIP_FATHER,
  LEGAL_GUARDIAN: PROF.RELATIONSHIP_GUARDIAN,
  GRANDPARENT: PROF.RELATIONSHIP_GRANDPARENT,
  SIBLING: PROF.RELATIONSHIP_SIBLING,
  UNCLE_AUNT: PROF.RELATIONSHIP_UNCLE_AUNT,
  OTHER_RELATIVE: PROF.RELATIONSHIP_OTHER_RELATIVE,
};

/** El 409 opaco de un documento ya registrado (el mismo en todos los caminos). */
function documentRegisteredConflict(): ConflictException {
  return new ConflictException(
    'Ese documento ya está registrado. Búsquelo por documento en lugar ' +
      'de registrarlo de nuevo.',
    undefined,
    Reason.SUPPORT_PATIENT_DOCUMENT_REGISTERED,
  );
}

/** Hecho que se publica para que alguien entregue la invitación al portal. */
export const PATIENT_PORTAL_INVITATION_EVENT =
  'profiles.patient_portal_invitation.requested';

/** Resultado interno: los rechazos se informan después de sellar la bitácora. */
type RegisterOutcome =
  | { kind: 'done'; body: SupportPatientRegistrationResponseDto }
  | { kind: 'denied' }
  | { kind: 'guardian-required' }
  | { kind: 'document-registered' };

/**
 * Alta rápida de un paciente por la persona de apoyo (`POST /me/support-patients`).
 *
 * ## Qué se puede mostrar de un posible duplicado
 *
 * Antes de crear se buscan parecidos en TODA la plataforma (la identidad de una
 * persona no es de una organización), pero lo que sale depende de a quién
 * pertenece el candidato:
 *
 * - **Paciente de la organización** (tiene citas aquí, una representación legal
 *   aquí o lo registró alguien de aquí): perfil, nombre, edad, documento y
 *   teléfono tapados y, si es menor, sus representantes. Es lo mínimo para decir
 *   «es esta persona» y seguir con ella.
 * - **Paciente de otra organización**: ni perfil, ni nombre, ni edad ni
 *   documento del registro ajeno. Solo que existe alguien que coincide y con qué
 *   (documento, nombre y nacimiento, teléfono y apellido). Lo tapado que sale es
 *   lo que quien registra acaba de escribir.
 *
 * Y el intento cuenta para el mismo tope por persona que la búsqueda: probar
 * documentos para ver si «ya existen» sería, si no, una búsqueda sin freno.
 *
 * ## Reglas
 *
 * - Exige `patient.register` en la organización indicada (vínculo vigente).
 * - El documento se guarda y se compara en su forma canónica (mayúsculas, sin
 *   puntos, guiones ni espacios y sin ceros de relleno), con un cerrojo por
 *   documento: dos altas simultáneas no pasan las dos. Un documento ya
 *   registrado no se duplica nunca: `acknowledgeDuplicates` no lo salta (409
 *   `SUPPORT_PATIENT_DOCUMENT_REGISTERED`).
 * - El paciente nace SIN VERIFICAR: lo escribe el mostrador, nadie comprueba el
 *   documento. No hay cuenta, vínculo de cuenta ni aserción de identidad, y el
 *   registro propio del titular lo reclama.
 * - Un menor de 18 años exige `guardian`. El mostrador NO crea representaciones
 *   legales: el representante queda como persona relacionada (familiar
 *   autorizado), «pendiente de verificación», y su documento no se guarda ni se
 *   usa para buscar su cuenta. La representación legal la crea un SECURITY_ADMIN
 *   con `documentRef` por la ruta oficial, o el propio representante al
 *   aceptarla desde su cuenta. La respuesta es la misma exista o no una cuenta
 *   con ese documento.
 * - `inviteToPortal` publica `profiles.patient_portal_invitation.requested` en el
 *   outbox (solo ids): quien entrega la invitación la lee de ahí. El portal no
 *   recibe contraseña ni token por esta vía. El destino de la invitación sale
 *   de la cuenta o del contacto verificado del paciente, nunca del registro.
 * - El tope de consultas se cuenta ANTES de todo, fuera de la transacción
 *   (`SupportPatientProbeCounter`): lo rechazado, el 409 y lo que acabe en
 *   excepción cuentan.
 * - Todo lo que es de la organización (la creación, el aviso de duplicados y los
 *   rechazos de su personal) queda sellado en ella. El rechazo de quien no tiene
 *   vínculo vivo allí se sella en la partición propia de esa persona, nunca en
 *   la cadena de una organización ajena.
 */
@Injectable()
export class SupportPatientRegistrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param policy - Política de acceso del personal de apoyo.
   * @param engagements - Vínculos de apoyo.
   * @param patients - Lecturas de pacientes del personal de apoyo.
   * @param persons - Personas (alta de `profiles`).
   * @param personProfiles - Perfiles de persona (alta de `profiles`).
   * @param patientProfiles - Perfiles de paciente (alta de `profiles`).
   * @param identifiers - Documentos (alta de `profiles`).
   * @param contactPoints - Teléfonos (alta de `profiles`).
   * @param relatedPersons - Personas relacionadas (alta de `profiles`).
   * @param outbox - Publicación de la invitación al portal.
   * @param audit - Sello en la cadena de auditoría.
   * @param probes - Contador atómico de consultas (persona e IP).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly policy: SupportAccessPolicy,
    private readonly engagements: SupportAccessRepository,
    private readonly patients: SupportPatientsRepository,
    private readonly persons: PersonsRepository,
    private readonly personProfiles: PersonProfilesRepository,
    private readonly patientProfiles: PatientProfilesRepository,
    private readonly identifiers: IdentifiersRepository,
    private readonly contactPoints: ContactPointsRepository,
    private readonly relatedPersons: RelatedPersonsRepository,
    private readonly outbox: OutboxService,
    private readonly audit: AuditTrailService,
    private readonly probes: SupportPatientProbeCounter,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportPatientRegistrationService.name);
  }

  /**
   * Registra a un paciente nuevo o avisa de posibles duplicados.
   *
   * @param dto - Organización, filiación, representante y opciones.
   * @param actor - La persona de apoyo.
   * @param ip - IP de origen (tope por IP).
   * @returns `CREATED` con el paciente, o `POSSIBLE_DUPLICATES` con los parecidos.
   */
  async register(
    dto: RegisterSupportPatientDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<SupportPatientRegistrationResponseDto> {
    // Primero se cuenta, antes de resolver el cuerpo y fuera de la transacción.
    const probe = await this.probes.hit(actor.id, ip);
    if (!probe.allowed) {
      if (probe.firstOverflow) {
        await this.em.transactional((tx) =>
          sealInOwnPartition(this.audit, tx, actor, {
            action: 'SUPPORT_PATIENT_REGISTER_THROTTLED',
            entity: 'patient_registration',
            success: false,
          }),
        );
      }
      throw throttledException(probe.exceeded);
    }
    const tenantId = resolveTenantId(dto);
    const nationalId = normalizeNationalId(resolveNationalId(dto) ?? '');
    if (nationalId.length < MIN_NATIONAL_ID_LENGTH) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'El documento de identidad no es válido.',
        { field: 'document' },
      );
    }
    if (!isRealDate(dto.birthDate)) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'La fecha de nacimiento no es una fecha real.',
        { field: 'birthDate' },
      );
    }
    // Con RLS la ruta no trae organización activa: el alta entra a la del cuerpo
    // (`withTenantContext`) para ver SUS vínculos y sellar en ella.
    let outcome: RegisterOutcome;
    try {
      outcome = await this.em.transactional((tx): Promise<RegisterOutcome> =>
        withTenantContext(tx, tenantId, () =>
          this.registerInTransaction(tx, dto, actor, tenantId, nationalId),
        ),
      );
    } catch (error) {
      // Dos altas del mismo documento que pasaron a la vez la comprobación de
      // parecidos: el índice único del modelo rechazó la segunda (23505) y la
      // transacción quedó abortada, así que el rechazo se sella en una nueva,
      // en la partición de la propia persona, y se contesta lo mismo que el
      // 409 de siempre.
      if (error instanceof PatientDocumentRegisteredException) {
        await this.em.transactional((tx) =>
          sealInOwnPartition(this.audit, tx, actor, {
            action: 'SUPPORT_PATIENT_REGISTER_REJECTED',
            entity: 'patient_registration',
            success: false,
          }),
        );
        throw documentRegisteredConflict();
      }
      throw error;
    }
    switch (outcome.kind) {
      case 'denied':
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'No puede registrar pacientes en esta organización',
          undefined,
          Reason.SUPPORT_PATIENT_REGISTER_DENIED,
        );
      case 'guardian-required':
        throw new PreconditionFailedException(
          'Un menor de edad se registra con su representante legal o un ' +
            'familiar autorizado: indique su nombre, documento, teléfono y parentesco.',
          { field: 'guardian', adultAge: ADULT_AGE_YEARS },
          Reason.SUPPORT_PATIENT_GUARDIAN_REQUIRED,
        );
      case 'document-registered':
        throw documentRegisteredConflict();
      case 'done':
        return outcome.body;
    }
  }

  /** El cuerpo transaccional: vínculo y permiso, parecidos y alta. */
  private async registerInTransaction(
    tx: EntityManager,
    dto: RegisterSupportPatientDto,
    actor: AuthenticatedUser,
    tenantId: string,
    nationalId: string,
  ): Promise<RegisterOutcome> {
    const now = new Date();
    const standing = await loadPatientStanding(
      this.policy,
      this.engagements,
      tx,
      actor.id,
      tenantId,
      now,
      'register',
    );
    if (!standing.canRegister) {
      if (standing.linked) {
        await this.seal(
          tx,
          actor,
          tenantId,
          'SUPPORT_PATIENT_REGISTER_DENIED',
          { success: false },
        );
      } else {
        // Sin vínculo vivo en la organización del cuerpo: el rechazo es de la
        // persona, no de esa organización.
        await sealInOwnPartition(this.audit, tx, actor, {
          action: 'SUPPORT_PATIENT_REGISTER_DENIED',
          entity: 'patient_registration',
          success: false,
        });
      }
      return { kind: 'denied' };
    }

    const age = ageInYears(dto.birthDate, now) ?? ADULT_AGE_YEARS;
    const isMinor = age < ADULT_AGE_YEARS;
    if (isMinor && !dto.guardian) {
      await this.seal(
        tx,
        actor,
        tenantId,
        'SUPPORT_PATIENT_REGISTER_REJECTED',
        {
          success: false,
        },
      );
      return { kind: 'guardian-required' };
    }

    const fullName = composeAccountDisplayName({
      name: dto.name,
      lastName: dto.lastName,
      motherLastName: dto.motherLastName,
    });
    // Cerrojo por documento: dos altas simultáneas no pasan las dos.
    await this.patients.lockDocument(tx, nationalId);
    const candidates = await this.patients.findDuplicateCandidates(tx, {
      tenantId,
      nationalId,
      fullName,
      lastName: dto.lastName,
      birthDate: dto.birthDate,
      phone: dto.phone,
    });
    const sameDocument = candidates.some((c) => c.basis.includes('DOCUMENT'));
    if (sameDocument && dto.acknowledgeDuplicates === true) {
      // El documento identifica a una sola persona: seguir «de todos modos»
      // aplica a los parecidos, no a un documento que ya está registrado.
      await this.seal(
        tx,
        actor,
        tenantId,
        'SUPPORT_PATIENT_REGISTER_REJECTED',
        {
          success: false,
        },
      );
      return { kind: 'document-registered' };
    }
    if (candidates.length > 0 && dto.acknowledgeDuplicates !== true) {
      return this.duplicatesOutcome(
        tx,
        actor,
        tenantId,
        dto,
        nationalId,
        candidates,
        now,
      );
    }

    const guardianKind = dto.guardian
      ? classifyGuardianRelationship(dto.guardian.relationship)
      : undefined;
    const created = await registerPatientRecords(this.intakeRepos(), tx, {
      name: dto.name.trim(),
      lastName: dto.lastName.trim(),
      motherLastName: dto.motherLastName?.trim() || undefined,
      nationalId,
      birthDate: dto.birthDate,
      phone: dto.phone.trim(),
      ...(dto.guardian && guardianKind
        ? {
            guardianName: dto.guardian.name.trim(),
            guardianPhone: dto.guardian.phone.trim(),
            guardianRelationshipConceptId:
              RELATED_CONCEPT_BY_KIND[guardianKind.kind],
          }
        : {}),
      actorUserId: actor.id,
    });
    await this.seal(tx, actor, tenantId, 'SUPPORT_PATIENT_REGISTERED', {
      success: true,
      entityId: created.patientProfileId,
      entity: 'patient',
    });

    const representatives: RepresentativeRow[] = [];
    let guardianRecorded = false;
    if (dto.guardian && guardianKind && created.guardian) {
      // El mostrador no crea representación legal: la persona queda como
      // familiar autorizado, pendiente de verificación.
      await this.seal(
        tx,
        actor,
        tenantId,
        'SUPPORT_PATIENT_GUARDIAN_PENDING_VERIFICATION',
        {
          success: true,
          entityId: created.patientProfileId,
          entity: 'patient',
        },
      );
      representatives.push({
        id: created.guardian.relatedPersonId,
        name: dto.guardian.name.trim(),
        relationshipConceptId: RELATED_CONCEPT_BY_KIND[guardianKind.kind],
        legalRepresentation: false,
      });
      guardianRecorded = true;
    }

    let invitationSent = false;
    if (dto.inviteToPortal === true) {
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: PATIENT_PORTAL_INVITATION_EVENT,
        aggregateType: 'patient_profile',
        aggregateId: created.patientProfileId,
        payloadJson: {
          patientProfileId: created.patientProfileId,
          tenantId,
          requestedByUserId: actor.id,
        },
        actorUserId: actor.id,
      });
      await this.seal(tx, actor, tenantId, 'SUPPORT_PATIENT_PORTAL_INVITED', {
        success: true,
        entityId: created.patientProfileId,
        entity: 'patient',
      });
      invitationSent = true;
    }

    this.logger.info(
      {
        operation: 'delegated_access.support_patient.register',
        tenantId,
        userId: actor.id,
        patientProfileId: created.patientProfileId,
        isMinor,
        guardianRecorded,
        invitationSent,
      },
      'Support patient registered',
    );
    const patient = toMatchDto(
      {
        profileId: created.patientProfileId,
        displayName: fullName,
        birthDate: dto.birthDate,
        nationalId,
        phone: dto.phone,
      },
      new Map([[created.patientProfileId, representatives]]),
      now,
    );
    return {
      kind: 'done',
      body: {
        outcome: 'CREATED',
        patient,
        invitationSent,
        identityVerified: false,
        ...(guardianRecorded
          ? {
              guardian: {
                recorded: true as const,
                status: 'PENDING_VERIFICATION' as const,
              },
            }
          : {}),
      },
    };
  }

  /** Responde con los parecidos, sellando el aviso y a quienes se les mostró. */
  private async duplicatesOutcome(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    dto: RegisterSupportPatientDto,
    nationalId: string,
    candidates: Awaited<
      ReturnType<SupportPatientsRepository['findDuplicateCandidates']>
    >,
    now: Date,
  ): Promise<RegisterOutcome> {
    await this.seal(
      tx,
      actor,
      tenantId,
      'SUPPORT_PATIENT_REGISTER_DUPLICATES',
      {
        success: true,
      },
    );
    const linked = candidates.filter((c) => c.linkedToTenant);
    // Un asiento por paciente cuyo perfil se mostró: «quién vio al paciente X».
    for (const row of linked) {
      await this.audit.record(tx, actor, {
        action: 'SUPPORT_PATIENT_SEARCH_MATCH',
        entity: 'patient',
        entityId: row.profileId,
        tenantId,
        success: true,
      });
    }
    const minors = linked
      .filter(
        (c) =>
          (ageInYears(c.birthDate, now) ?? ADULT_AGE_YEARS) < ADULT_AGE_YEARS,
      )
      .map((c) => c.profileId);
    const representatives = await this.patients.findRepresentatives(
      tx,
      tenantId,
      minors,
    );
    const duplicates: SupportPatientDuplicateDto[] = candidates.map((row) =>
      toDuplicateDto(
        row,
        { nationalId, birthDate: dto.birthDate },
        representatives,
        now,
      ),
    );
    return {
      kind: 'done',
      body: { outcome: 'POSSIBLE_DUPLICATES', duplicates },
    };
  }

  /** Repositorios del alta compartida con el mostrador. */
  private intakeRepos(): PatientIntakeRepos {
    return {
      persons: this.persons,
      personProfiles: this.personProfiles,
      patientProfiles: this.patientProfiles,
      identifiers: this.identifiers,
      contactPoints: this.contactPoints,
      relatedPersons: this.relatedPersons,
    };
  }

  /** Sella un paso del alta en la cadena de auditoría (sin datos del paciente). */
  private async seal(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    action: string,
    options: { success: boolean; entity?: string; entityId?: string },
  ): Promise<void> {
    await this.audit.record(tx, actor, {
      action,
      entity: options.entity ?? 'patient_registration',
      entityId: options.entityId,
      tenantId,
      success: options.success,
    });
  }
}
