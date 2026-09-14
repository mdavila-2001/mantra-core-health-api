import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { TenantMembershipsRepository } from '../../directory/repositories';
import { DIR } from '../../directory/directory.concepts';
import { IDA } from '../identity_assurance.concepts';
import {
  IDENTITY_CARD_VERTICAL,
  INSTITUTION_DOCUMENT_VERTICAL,
  MEDICAL_LICENSE_VERTICAL,
  PRACTITIONER_IDENTITY_VERTICAL,
  type IdentityVerificationVertical,
} from '../identity_assurance.seed';
import {
  IdentityCheckResultsRepository,
  IdentityChecksRepository,
  IdentityEvidenceRecordsRepository,
  IdentityManualReviewCasesRepository,
  IdentityVerificationCasesRepository,
} from '../repositories';
import type { IdentityVerificationCases } from '../entities';
import type {
  CaseCheckDto,
  RequestLicenseVerificationDto,
  RequestVerificationDto,
  VerificationRequestResponseDto,
  VerificationStatusResponseDto,
  VerificationTypeDto,
  VerificationTypesResponseDto,
} from '../dto';

/**
 * Código de tipo de solicitud (catálogo de autoservicio) por sujeto del caso.
 * Es lo que distingue en la lista/detalle una verificación de identidad
 * profesional de una de matrícula — ambas comparten check y hasta política en
 * el caso de identidad, y sólo el `subjectTypeConceptId` las separa.
 */
const TYPE_CODE_BY_SUBJECT: Readonly<Record<string, string>> = {
  [IDA.SUBJECT_PRACTITIONER_IDENTITY]: 'PRACTITIONER_IDENTITY',
  [IDA.SUBJECT_PRACTITIONER_LICENSE]: 'PRACTITIONER_LICENSE',
  [IDA.SUBJECT_PATIENT_IDENTITY]: 'PATIENT_IDENTITY',
  [IDA.SUBJECT_TENANT_IDENTITY]: 'TENANT_VERIFICATION',
};

const UNKNOWN_TYPE_CODE = 'UNKNOWN';

/** El código de tipo de solicitud a partir del sujeto del caso. */
function typeCodeForSubject(subjectTypeConceptId: string): string {
  return TYPE_CODE_BY_SUBJECT[subjectTypeConceptId] ?? UNKNOWN_TYPE_CODE;
}

/** Vigencia de un caso de verificación abierto por autoservicio (72 h). */
const CASE_TTL_HOURS = 72;
const MS_PER_HOUR = 3_600_000;

/** Estados en los que ya hay una verificación en marcha para ese sujeto. */
const LIVE_CASE_STATES = [
  IDA.CASE_OPEN,
  IDA.CASE_IN_VERIFICATION,
  IDA.CASE_AT_RISK,
  IDA.CASE_MANUAL_REVIEW,
];

/**
 * Solicitudes de verificación que el propio titular inicia: un paciente sube su
 * foto con el carnet, un profesional pide verificar su matrícula, el
 * responsable de una institución su documentación.
 *
 * En una sola operación hace lo que hasta ahora eran tres llamadas de
 * administrador (abrir caso, aportar evidencia, planificar checks). El sujeto
 * NUNCA llega por el cuerpo: se resuelve del usuario autenticado, de modo que
 * nadie pueda pedir la verificación de la identidad de otro.
 *
 * Los endpoints no se cuelgan de `profiles` ni de `directory` aunque sean sus
 * dominios: este módulo ya importa a ambos para aplicar los efectos, y hacerlo
 * al revés cerraría un ciclo entre módulos.
 */
@Injectable()
export class IdentitySelfServiceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param evidenceRepo - Valor de evidence repo requerido por la operación.
   * @param checksRepo - Valor de checks repo requerido por la operación.
   * @param accountLinksRepo - Valor de account links repo requerido por la operación.
   * @param practitionersRepo - Valor de practitioners repo requerido por la operación.
   * @param authorizationsRepo - Valor de authorizations repo requerido por la operación.
   * @param membershipsRepo - Valor de memberships repo requerido por la operación.
   * @param manualReviewRepo - De dónde sale el motivo cuando el caso escaló a revisión manual.
   * @param checkResultsRepo - Resultados de los checks, para el trace de la ficha.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: IdentityVerificationCasesRepository,
    private readonly evidenceRepo: IdentityEvidenceRecordsRepository,
    private readonly checksRepo: IdentityChecksRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly manualReviewRepo: IdentityManualReviewCasesRepository,
    private readonly checkResultsRepo: IdentityCheckResultsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentitySelfServiceService.name);
  }

  /** El paciente pide verificar su identidad con una foto con su carnet. */
  async requestPatientIdentity(
    dto: RequestVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const personId = await this.resolvePersonId(tx, actor.id);
      return this.openVerification(
        tx,
        IDENTITY_CARD_VERTICAL,
        personId,
        dto.evidenceFileId,
        actor,
      );
    });
  }

  /** El profesional pide verificar su identidad. */
  async requestPractitionerIdentity(
    dto: RequestVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const personId = await this.resolvePersonId(tx, actor.id);
      await this.assertIsPractitioner(tx, personId);
      return this.openVerification(
        tx,
        PRACTITIONER_IDENTITY_VERTICAL,
        personId,
        dto.evidenceFileId,
        actor,
      );
    });
  }

  /**
   * El profesional pide verificar su matrícula.
   *
   * El sujeto del caso es la matrícula, no la persona: es lo que la autoridad
   * comprueba y lo que se activa al verificarse.
   */
  async requestPractitionerLicense(
    dto: RequestLicenseVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const personId = await this.resolvePersonId(tx, actor.id);
      await this.assertIsPractitioner(tx, personId);

      if (!dto.jurisdictionAuthorizationId) {
        throw new PreconditionFailedException(
          'Indique qué matrícula quiere verificar',
        );
      }
      const authorization = await this.authorizationsRepo.findById(
        tx,
        dto.jurisdictionAuthorizationId,
      );
      if (!authorization) {
        throw new ResourceNotFoundException('Matrícula no encontrada', {
          jurisdictionAuthorizationId: dto.jurisdictionAuthorizationId,
        });
      }
      // Verificar la matrícula de otro profesional la activaría a su nombre.
      if (authorization.practitionerProfileId !== personId) {
        throw new PreconditionFailedException(
          'La matrícula pertenece a otro profesional',
          { jurisdictionAuthorizationId: dto.jurisdictionAuthorizationId },
        );
      }

      return this.openVerification(
        tx,
        MEDICAL_LICENSE_VERTICAL,
        authorization.id,
        dto.evidenceFileId,
        actor,
      );
    });
  }

  /** El responsable de una institución pide verificarla. */
  async requestTenantVerification(
    tenantId: string,
    dto: RequestVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const membership = await this.membershipsRepo.findActiveByUserTenant(
        tx,
        actor.id,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
      );
      if (!membership) {
        throw new PreconditionFailedException(
          'No pertenece a esa institución',
          { tenantId },
        );
      }
      // Sólo quien manda en el tenant compromete su verificación.
      if (
        membership.tenantRoleConceptId !== DIR.ROLE_OWNER &&
        membership.tenantRoleConceptId !== DIR.ROLE_ADMIN
      ) {
        throw new PreconditionFailedException(
          'Sólo el titular o un administrador de la institución puede pedir su verificación',
          { tenantId },
        );
      }

      return this.openVerification(
        tx,
        INSTITUTION_DOCUMENT_VERTICAL,
        tenantId,
        dto.evidenceFileId,
        actor,
      );
    });
  }

  /**
   * Estado de un caso propio, para que el cliente pueda esperar el veredicto.
   *
   * @param caseId - Caso a consultar.
   * @param actor - Usuario autenticado.
   * @returns Estado del caso.
   * @throws ResourceNotFoundException si no existe o no es del solicitante.
   */
  async getOwnCaseStatus(
    caseId: string,
    actor: AuthenticatedUser,
  ): Promise<VerificationStatusResponseDto> {
    const em = this.em.fork();
    const kase = await this.casesRepo.findById(em, caseId);
    if (!kase) {
      throw new ResourceNotFoundException('Caso no encontrado', { caseId });
    }

    const isOwn = await this.isOwnSubject(em, kase.subjectEntityId, actor.id);
    if (!isOwn) {
      // Mismo error que si no existiera: distinguirlos revelaría qué ids son
      // casos reales de otras personas.
      throw new ResourceNotFoundException('Caso no encontrado', { caseId });
    }

    return this.toStatusResponse(em, kase, /* detailed */ true);
  }

  /**
   * Lista los casos de verificación propios, del más reciente al más antiguo.
   *
   * Sin esto, consultar el estado exigía conocer el `caseId`: quien reinstala
   * la app o cambia de dispositivo no tenía forma de saber si su cuenta —o su
   * matrícula— está verificada, que es justo lo que la pantalla de perfil
   * necesita mostrar.
   *
   * Reúne los dos tipos de sujeto que puede tener una persona: ella misma en
   * las verificaciones de identidad, y cada una de sus matrículas en las de
   * licencia. Una cuenta sin persona vinculada no tiene casos, y eso es una
   * lista vacía, no un error: es el estado normal de un usuario administrativo.
   *
   * @param actor - Titular autenticado.
   * @returns Sus casos, ordenados por apertura descendente.
   */
  async listOwnCases(
    actor: AuthenticatedUser,
  ): Promise<VerificationStatusResponseDto[]> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return [];

    const authorizations = await this.authorizationsRepo.findByPractitioner(
      em,
      link.personId,
    );
    const subjects = [
      link.personId,
      ...authorizations.map((authorization) => authorization.id),
    ];

    const cases = await this.casesRepo.findBySubjects(em, subjects);
    // Sin `checks`/`reasonText`: la lista es la tabla de FT-32-R01..R04, no la
    // ficha de detalle. Traerlos acá pagaría un N+1 (evidencia + revisión +
    // checks + resultado por check) por cada fila que nadie va a abrir.
    return Promise.all(
      cases.map((kase) =>
        this.toStatusResponse(em, kase, /* detailed */ false),
      ),
    );
  }

  /**
   * Los tipos de solicitud de verificación que el titular puede iniciar, con
   * si cada uno ya tiene una solicitud viva (FT-32-R09/R11).
   *
   * Acotado a lo que compete al módulo Doctor: identidad profesional y cada
   * matrícula propia. `hasPendingRequest` es sólo lo que deja a la pantalla no
   * ofrecer un envío que el backend va a rechazar de todas formas —el rechazo
   * real sigue viviendo en `openVerification`, que es lo único que un bypass
   * directo a la API no puede saltear.
   *
   * @param actor - Titular autenticado.
   * @returns El catálogo de tipos disponibles para su cuenta.
   */
  async listAvailableTypes(
    actor: AuthenticatedUser,
  ): Promise<VerificationTypesResponseDto> {
    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return { types: [] };

    const practitioner = await this.practitionersRepo.findById(
      em,
      link.personId,
    );
    if (!practitioner) return { types: [] };

    const types: VerificationTypeDto[] = [];

    const identityLive = await this.casesRepo.countLiveForSubject(
      em,
      PRACTITIONER_IDENTITY_VERTICAL.subjectTypeConceptId,
      link.personId,
      LIVE_CASE_STATES,
    );
    types.push({
      code: 'PRACTITIONER_IDENTITY',
      label: 'Verificación de identidad profesional',
      hasPendingRequest: identityLive > 0,
    });

    const authorizations = await this.authorizationsRepo.findByPractitioner(
      em,
      link.personId,
    );
    for (const authorization of authorizations) {
      const licenseLive = await this.casesRepo.countLiveForSubject(
        em,
        MEDICAL_LICENSE_VERTICAL.subjectTypeConceptId,
        authorization.id,
        LIVE_CASE_STATES,
      );
      types.push({
        code: 'PRACTITIONER_LICENSE',
        label:
          authorizations.length > 1
            ? `Verificación de matrícula (${authorization.licenseNumber})`
            : 'Verificación de matrícula profesional',
        jurisdictionAuthorizationId: authorization.id,
        hasPendingRequest: licenseLive > 0,
      });
    }

    return { types };
  }

  /**
   * Arma la respuesta de estado de un caso propio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param kase - Caso ya resuelto y comprobado como propio.
   * @param detailed - `true` para la ficha (agrega motivo y trace de checks).
   * @returns El caso en el contrato `VerificationStatusResponseDto`.
   */
  private async toStatusResponse(
    em: EntityManager,
    kase: IdentityVerificationCases,
    detailed: boolean,
  ): Promise<VerificationStatusResponseDto> {
    const evidence = await this.evidenceRepo.findLatestByCase(em, kase.id);

    const base: VerificationStatusResponseDto = {
      id: kase.id,
      status: kase.statusConceptId,
      type: typeCodeForSubject(kase.subjectTypeConceptId),
      ...(kase.openedAt ? { openedAt: kase.openedAt } : {}),
      ...(kase.completedAt ? { completedAt: kase.completedAt } : {}),
      ...(evidence?.evidenceFileId
        ? { evidenceFileId: evidence.evidenceFileId }
        : {}),
    };
    if (!detailed) return base;

    const review = await this.manualReviewRepo.findLatestDecidedByCase(
      em,
      kase.id,
    );
    const checks = await this.checksRepo.findRequiredByCase(em, kase.id);
    const checkDtos: CaseCheckDto[] = [];
    for (const check of checks) {
      const result = await this.checkResultsRepo.findLatestByCheck(
        em,
        check.id,
      );
      checkDtos.push({
        checkTypeConceptId: check.checkTypeConceptId,
        status: check.statusConceptId,
        ...(result
          ? {
              resultConceptId: result.resultConceptId,
              checkedAt: result.checkedAt,
            }
          : {}),
      });
    }

    return {
      ...base,
      ...(review?.decisionReason ? { reasonText: review.decisionReason } : {}),
      checks: checkDtos,
    };
  }

  // --- Apoyo ---

  /**
   * Abre el caso, registra la evidencia y planifica su check obligatorio.
   *
   * @param tx - Transacción activa.
   * @param vertical - Política, tipo de sujeto, check y evidencia esperados.
   * @param subjectEntityId - Qué se verifica.
   * @param evidenceFileId - Archivo aportado.
   * @param actor - Usuario autenticado.
   * @returns Caso y check recién creados.
   * @throws ConflictException si ese sujeto ya tiene una verificación en marcha.
   */
  private async openVerification(
    tx: EntityManager,
    vertical: IdentityVerificationVertical,
    subjectEntityId: string,
    evidenceFileId: string,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    const live = await this.casesRepo.countLiveForSubject(
      tx,
      vertical.subjectTypeConceptId,
      subjectEntityId,
      LIVE_CASE_STATES,
    );
    if (live > 0) {
      throw new ConflictException(
        'Ya hay una verificación en curso para este sujeto',
        { subjectEntityId },
      );
    }

    const now = new Date();
    const kase = this.casesRepo.create(tx, {
      subjectTypeConceptId: vertical.subjectTypeConceptId,
      subjectEntityId,
      identityVerificationPolicyId: vertical.policyId,
      requestedAssuranceLevelConceptId: IDA.ASSURANCE_LEVEL_IAL2,
      statusConceptId: IDA.CASE_OPEN,
      riskScore: '0',
      openedAt: now,
      expiresAt: new Date(now.getTime() + CASE_TTL_HOURS * MS_PER_HOUR),
      actorUserId: actor.id,
    });
    // Las FK son columnas uuid planas: persistir el caso antes de sus hijos.
    await tx.flush();

    await this.evidenceRepo.create(tx, {
      identityVerificationCaseId: kase.id,
      evidenceTypeConceptId: vertical.evidenceTypeConceptId,
      evidenceFileId,
      verificationStatusConceptId: IDA.EVIDENCE_PENDING,
      actorUserId: actor.id,
    });

    const check = this.checksRepo.create(tx, {
      identityVerificationCaseId: kase.id,
      checkTypeConceptId: vertical.checkTypeConceptId,
      // Obligatorio: es el único check del caso, y es el que lo decide.
      required: true,
      checkSequence: 1,
      statusConceptId: IDA.CHECK_PENDING,
      actorUserId: actor.id,
    });

    // El caso queda en verificación desde ya: el worker lo despachará en su
    // próximo tick, no hace falta un paso aparte de "planificar".
    kase.statusConceptId = IDA.CASE_IN_VERIFICATION;
    await tx.flush();

    this.logger.info(
      {
        operation: 'ida.self-service.request',
        caseId: kase.id,
        policyCode: vertical.policyCode,
      },
      'Verification requested by its own subject',
    );
    return {
      caseId: kase.id,
      checkId: check.id,
      status: kase.statusConceptId,
    };
  }

  /**
   * Persona vinculada a la cuenta autenticada.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta autenticada.
   * @returns Identificador de la persona.
   * @throws PreconditionFailedException si la cuenta no tiene persona vinculada.
   */
  private async resolvePersonId(
    tx: EntityManager,
    userId: string,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(tx, userId);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }
    return link.personId;
  }

  /**
   * Comprueba que la persona tenga perfil profesional.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param personId - Persona a comprobar.
   * @throws PreconditionFailedException si no es profesional.
   */
  private async assertIsPractitioner(
    tx: EntityManager,
    personId: string,
  ): Promise<void> {
    const practitioner = await this.practitionersRepo.findById(tx, personId);
    if (!practitioner) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional',
      );
    }
  }

  /**
   * ¿El sujeto del caso le pertenece al solicitante?
   *
   * Cubre las tres verticales: su propia persona, una matrícula suya o una
   * institución en la que manda.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectEntityId - Sujeto del caso.
   * @param userId - Cuenta autenticada.
   * @returns `true` si el caso es del solicitante.
   */
  private async isOwnSubject(
    em: EntityManager,
    subjectEntityId: string,
    userId: string,
  ): Promise<boolean> {
    const link = await this.accountLinksRepo.findActiveByUser(em, userId);
    if (link?.personId === subjectEntityId) return true;

    if (link) {
      const authorization = await this.authorizationsRepo.findById(
        em,
        subjectEntityId,
      );
      if (authorization?.practitionerProfileId === link.personId) return true;
    }

    const membership = await this.membershipsRepo.findActiveByUserTenant(
      em,
      userId,
      subjectEntityId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    return membership !== null;
  }
}
