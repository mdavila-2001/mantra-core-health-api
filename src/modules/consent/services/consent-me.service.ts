import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import {
  Consents,
  HipaaAuthorizations,
  PatientObjections,
  ProcessingPurposes,
  TreatmentInformedConsents,
} from '../entities';
import { CONS } from '../consent.concepts';
import { ConsentsService } from './consents.service';
import type {
  ConsentPurposeDto,
  ConsentRecordState,
  MyConsentListDto,
  MyHipaaAuthorizationListDto,
  MyObjectionListDto,
  MyTreatmentConsentListDto,
  StatusResultDto,
  WithdrawConsentDto,
} from '../dto';

/** Tope de filas por lista: es la ficha de una persona, no un reporte. */
const LIST_LIMIT = 200;

/**
 * «Mi privacidad»: lo que el titular ve —y lo único que puede cambiar— de sus
 * consentimientos, autorizaciones, objeciones y consentimientos informados.
 *
 * ## Aislamiento por titular
 *
 * La persona sale de la cuenta (`person_account_links`), nunca de un id del
 * cuerpo ni de la ruta: igual que `diagnostic-results/me`. Un consentimiento de
 * otra persona es **404**, no 403: no se revela que existe.
 *
 * ## Retirar
 *
 * Delega en `ConsentsService.withdraw` (UC-07-02): cambia el estado, cierra la
 * vigencia y propaga a los accesos que se apoyaban en él, en una transacción.
 * **La fila no se borra.**
 */
@Injectable()
export class ConsentMeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param accountLinksRepo - Vínculo cuenta↔persona.
   * @param patientProfilesRepo - Perfil de paciente de la persona.
   * @param consents - Caso de uso de retiro.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly consents: ConsentsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConsentMeService.name);
  }

  /**
   * Consentimientos de privacidad del titular, vigentes y retirados.
   *
   * Las solicitudes de vínculo de un profesional (`CATEGORY_PRACTITIONER_ACCESS`)
   * también viven en `consent.consents` pero no son consentimientos del titular:
   * tienen su propia bandeja y no se listan acá.
   *
   * @param actor - Usuario autenticado.
   * @returns Los consentimientos, del más reciente al más antiguo.
   */
  async listConsents(actor: AuthenticatedUser): Promise<MyConsentListDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) return { items: [] };

    const rows = await em.find(
      Consents,
      {
        patientProfileId,
        categoryConceptId: { $ne: CONS.CATEGORY_PRACTITIONER_ACCESS },
      },
      { orderBy: { createdAt: 'DESC' }, limit: LIST_LIMIT },
    );
    const purposes = await this.purposesById(
      em,
      rows.map((row) => row.processingPurposeId),
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        state: this.consentState(row.statusConceptId),
        purpose: purposes.get(row.processingPurposeId) ?? {
          id: row.processingPurposeId,
        },
        validFrom: row.validFrom,
        validTo: row.validTo,
        withdrawnAt: row.withdrawnAt,
        policyVersion: row.policyVersion,
        createdAt: row.createdAt,
      })),
    };
  }

  /**
   * Autorizaciones de divulgación del titular.
   *
   * @param actor - Usuario autenticado.
   * @returns Las autorizaciones, de la más reciente a la más antigua.
   */
  async listHipaaAuthorizations(
    actor: AuthenticatedUser,
  ): Promise<MyHipaaAuthorizationListDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) return { items: [] };

    const rows = await em.find(
      HipaaAuthorizations,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit: LIST_LIMIT },
    );
    const purposes = await this.purposesById(
      em,
      rows.map((row) => row.processingPurposeId),
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        state:
          row.statusConceptId === CONS.HIPAA_ACTIVE
            ? 'ACTIVE'
            : row.statusConceptId === CONS.HIPAA_REVOKED
              ? 'WITHDRAWN'
              : row.statusConceptId === CONS.HIPAA_EXPIRED
                ? 'EXPIRED'
                : 'OTHER',
        purpose: purposes.get(row.processingPurposeId) ?? {
          id: row.processingPurposeId,
        },
        recipientDescription: row.recipientDescription,
        informationDescription: row.informationDescription,
        expiresAt: row.expiresAt,
        signedAt: row.signedAt,
        revokedAt: row.revokedAt,
      })),
    };
  }

  /**
   * Objeciones del titular, abiertas y resueltas.
   *
   * @param actor - Usuario autenticado.
   * @returns Las objeciones, de la más reciente a la más antigua.
   */
  async listObjections(actor: AuthenticatedUser): Promise<MyObjectionListDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) return { items: [] };

    const rows = await em.find(
      PatientObjections,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit: LIST_LIMIT },
    );
    const purposes = await this.purposesById(
      em,
      rows.map((row) => row.processingPurposeId),
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        state:
          row.statusConceptId === CONS.OBJECTION_STATUS_RAISED
            ? 'RAISED'
            : row.statusConceptId === CONS.OBJECTION_STATUS_RESOLVED
              ? 'RESOLVED'
              : 'OTHER',
        purpose: purposes.get(row.processingPurposeId) ?? {
          id: row.processingPurposeId,
        },
        reasonText: row.reasonText,
        raisedAt: row.raisedAt,
        resolvedAt: row.resolvedAt,
      })),
    };
  }

  /**
   * Consentimientos informados de tratamiento que firmó el titular (CL-77).
   *
   * @param actor - Usuario autenticado.
   * @returns Los consentimientos informados, del más reciente al más antiguo.
   */
  async listTreatmentConsents(
    actor: AuthenticatedUser,
  ): Promise<MyTreatmentConsentListDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) return { items: [] };

    const rows = await em.find(
      TreatmentInformedConsents,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit: LIST_LIMIT },
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        encounterId: row.encounterId,
        decision:
          row.decisionConceptId === CONS.DECISION_ACCEPTED
            ? 'ACCEPTED'
            : row.decisionConceptId === CONS.DECISION_DECLINED
              ? 'DECLINED'
              : 'OTHER',
        informationVersion: row.informationVersion,
        signedAt: row.signedAt,
        withdrawnAt: row.withdrawnAt,
      })),
    };
  }

  /**
   * Retira un consentimiento propio.
   *
   * @param actor - Usuario autenticado (el titular).
   * @param consentId - Consentimiento a retirar.
   * @param dto - Motivo opcional.
   * @returns `{ ok: true }`.
   * @throws ResourceNotFoundException (404) si no existe o es de otra persona.
   */
  async withdrawOwn(
    actor: AuthenticatedUser,
    consentId: string,
    dto: WithdrawConsentDto,
  ): Promise<StatusResultDto> {
    const em = this.em.fork();
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    const consent = patientProfileId
      ? await em.findOne(Consents, { id: consentId, patientProfileId })
      : null;
    if (
      !consent ||
      consent.categoryConceptId === CONS.CATEGORY_PRACTITIONER_ACCESS
    ) {
      if (patientProfileId) {
        this.logger.warn(
          { operation: 'consent.me.withdraw.denied', consentId },
          'Intento de retirar un consentimiento que no es del titular',
        );
      }
      throw new ResourceNotFoundException('Consentimiento no encontrado', {
        consentId,
      });
    }
    return this.consents.withdraw(consent.id, dto, actor);
  }

  /**
   * Perfil de paciente del titular; `undefined` si la cuenta no tiene persona
   * vinculada o perfil (para las listas, «sin registros» es la respuesta).
   *
   * @param em - Contexto de persistencia.
   * @param actor - Usuario autenticado.
   * @returns El `patient_profile_id`, o `undefined`.
   */
  private async ownPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return undefined;
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    return patient?.profileId;
  }

  /**
   * Nombre y código de cada propósito, en una sola consulta.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Propósitos a resolver.
   * @returns Mapa `id -> propósito`.
   */
  private async purposesById(
    em: EntityManager,
    ids: string[],
  ): Promise<Map<string, ConsentPurposeDto>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const rows = await em.find(ProcessingPurposes, { id: { $in: unique } });
    return new Map(
      rows.map((row) => [
        row.id,
        { id: row.id, code: row.code, name: row.name },
      ]),
    );
  }

  /**
   * Estado legible de un consentimiento.
   *
   * @param statusConceptId - Concepto de estado guardado.
   * @returns El estado legible.
   */
  private consentState(statusConceptId: string): ConsentRecordState {
    if (statusConceptId === CONS.CONSENT_ACTIVE) return 'ACTIVE';
    if (statusConceptId === CONS.CONSENT_WITHDRAWN) return 'WITHDRAWN';
    if (statusConceptId === CONS.CONSENT_EXPIRED) return 'EXPIRED';
    return 'OTHER';
  }
}
