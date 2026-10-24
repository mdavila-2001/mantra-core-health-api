import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
  CONCEPTS,
} from '../../../common';
import { FilesRepository } from '../../common/repositories';
import {
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
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
import { NotificationsService } from '../../messaging/services';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  AuthenticationCredentials,
  EmailVerifications,
} from '../../iam/entities';
import type { IdentityVerificationCases } from '../entities';
import type {
  CaseCheckDto,
  RequestLicenseVerificationDto,
  RequestVerificationDto,
  VerificationRequestResponseDto,
  VerificationStatusResponseDto,
  VerificationTypeDto,
  VerificationTypesResponseDto,
  VerificationEvidenceDto,
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
    private readonly filesRepo: FilesRepository,
    private readonly notificationsService: NotificationsService,
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
        dto,
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
        dto,
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
        dto,
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
        dto,
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
    const records = await this.evidenceRepo.findByCase(em, kase.id);
    const evidence: VerificationEvidenceDto[] = records.map(
      (record, index) => ({
        id: record.id,
        evidenceTypeConceptId: record.evidenceTypeConceptId,
        ...(record.evidenceFileId
          ? { evidenceFileId: record.evidenceFileId }
          : {}),
        createdAt: record.createdAt,
        sequence: index + 1,
      }),
    );

    const base: VerificationStatusResponseDto = {
      id: kase.id,
      status: kase.statusConceptId,
      type: typeCodeForSubject(kase.subjectTypeConceptId),
      ...(kase.openedAt ? { openedAt: kase.openedAt } : {}),
      ...(kase.completedAt ? { completedAt: kase.completedAt } : {}),
      ...(evidence.length ? { evidence } : {}),
      ...(evidence.at(-1)?.evidenceFileId
        ? { evidenceFileId: evidence.at(-1)!.evidenceFileId }
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
    dto: RequestVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    const evidence = this.resolveEvidence(dto, vertical.evidenceTypeConceptId);
    if (!evidence.length) {
      throw new PreconditionFailedException(
        'Adjunta el frente, el reverso y las tres capturas de prueba de vida',
      );
    }
    for (const item of evidence) {
      const file = await this.filesRepo.findById(tx, item.fileId);
      if (
        !file ||
        file.createdByUserId !== actor.id ||
        file.sensitivityConceptId !== CONCEPTS.SENSITIVITY_PHI ||
        file.deletedAt
      ) {
        throw new PreconditionFailedException(
          'Una evidencia no existe, no pertenece a esta cuenta o no está protegida',
        );
      }
    }
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

    for (const item of evidence) {
      await this.evidenceRepo.create(tx, {
        identityVerificationCaseId: kase.id,
        evidenceTypeConceptId: item.typeId,
        evidenceFileId: item.fileId,
        verificationStatusConceptId: IDA.EVIDENCE_PENDING,
        actorUserId: actor.id,
      });
    }

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

    await this.sendConfirmationEmail(tx, kase, actor);

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

  /** Convierte el contrato nuevo de cinco evidencias o el contrato histórico. */
  private resolveEvidence(
    dto: RequestVerificationDto,
    legacyTypeId: string,
  ): Array<{ fileId: string; typeId: string }> {
    const values = [
      dto.documentFrontFileId,
      dto.documentBackFileId,
      dto.livenessCenterFileId,
      dto.livenessTurnLeftFileId,
      dto.livenessTurnRightFileId,
    ];
    const supplied = values.filter((value): value is string => Boolean(value));
    if (dto.evidenceFileId && supplied.length) {
      throw new PreconditionFailedException(
        'Envía el archivo histórico o las cinco evidencias nuevas, no ambos',
      );
    }
    if (dto.evidenceFileId) {
      return [{ fileId: dto.evidenceFileId, typeId: legacyTypeId }];
    }
    if (supplied.length === 0) return [];
    if (supplied.length !== values.length) {
      throw new PreconditionFailedException(
        'La verificación requiere las cinco evidencias en el orden solicitado',
      );
    }
    return [
      { fileId: values[0]!, typeId: IDA.EVIDENCE_TYPE_IDENTITY_DOCUMENT_FRONT },
      { fileId: values[1]!, typeId: IDA.EVIDENCE_TYPE_IDENTITY_DOCUMENT_BACK },
      { fileId: values[2]!, typeId: IDA.EVIDENCE_TYPE_LIVENESS_CENTER },
      { fileId: values[3]!, typeId: IDA.EVIDENCE_TYPE_LIVENESS_TURN_LEFT },
      { fileId: values[4]!, typeId: IDA.EVIDENCE_TYPE_LIVENESS_TURN_RIGHT },
    ];
  }

  /**
   * Envía un correo de confirmación de solicitud de verificación si el usuario
   * tiene una dirección de correo electrónico registrada.
   *
   * @param tx - Transacción o EntityManager activo.
   * @param kase - Caso de verificación recién abierto.
   * @param actor - Usuario solicitante.
   */
  private async sendConfirmationEmail(
    tx: EntityManager,
    kase: IdentityVerificationCases,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      const email = await this.findEmailForUser(tx, actor.id);
      if (!email) {
        this.logger.info(
          {
            operation: 'ida.self-service.confirm-email',
            caseId: kase.id,
            userId: actor.id,
          },
          'El usuario no tiene correo registrado; no se envió confirmación',
        );
        return;
      }

      await this.notificationsService.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: actor.id,
          recipientAddress: email,
          payloadJson: {
            subject: 'Confirmación de solicitud de verificación - AloVida',
            bodyText:
              'Estimado/a usuario/a,\n\n' +
              'Hemos recibido su solicitud de verificación de identidad.\n\n' +
              `Código de solicitud: ${kase.id}\n` +
              'Estado: En verificación\n\n' +
              'Nuestro equipo y el sistema revisarán la documentación aportada. ' +
              'Le notificaremos cuando el proceso haya concluido.\n\n' +
              'Atentamente,\n' +
              'Equipo de AloVida',
          },
        },
        actor,
      );

      this.logger.info(
        {
          operation: 'ida.self-service.confirm-email',
          caseId: kase.id,
          userId: actor.id,
          email,
        },
        'Correo de confirmación de verificación encolado exitosamente',
      );
    } catch (error) {
      this.logger.warn(
        {
          operation: 'ida.self-service.confirm-email',
          caseId: kase.id,
          userId: actor.id,
          err: error,
        },
        'No se pudo encolar el correo de confirmación de verificación',
      );
    }
  }

  /**
   * Resuelve la dirección de correo electrónico vinculada a un usuario.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Identificador del usuario.
   */
  private async findEmailForUser(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const credentials = await em.find(AuthenticationCredentials, { userId });
    const byCredential = credentials
      .map((credential) => credential.externalSubject)
      .find(
        (subject): subject is string =>
          typeof subject === 'string' && subject.includes('@'),
      );
    if (byCredential !== undefined) return byCredential.trim();

    const verification = await em.findOne(
      EmailVerifications,
      { userId },
      { orderBy: { createdAt: 'desc' } },
    );
    const declared = verification?.email?.trim();
    return declared === undefined || declared === '' ? null : declared;
  }
}
