import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClientContexts } from '../entities';

/** Datos de un contexto de cliente (UC-28-08). */
export interface CreateClientContextData {
  /**
   * Identificador asociado a session journey.
   */
  sessionJourneyId?: string;
  /**
   * Identificador asociado a analytics subject.
   */
  analyticsSubjectId?: string;
  /**
   * Identificador asociado a session.
   */
  sessionId?: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Identificador asociado a device type concept.
   */
  deviceTypeConceptId?: string;
  /**
   * Identificador asociado a os family concept.
   */
  osFamilyConceptId?: string;
  /**
   * Identificador asociado a browser family concept.
   */
  browserFamilyConceptId?: string;
  /**
   * Valor de app version mantenido por la instancia.
   */
  appVersion?: string;
  /**
   * Valor de screen class mantenido por la instancia.
   */
  screenClass?: string;
  /**
   * Valor de viewport bucket mantenido por la instancia.
   */
  viewportBucket?: string;
  /**
   * Valor de locale mantenido por la instancia.
   */
  locale?: string;
  /**
   * Valor de timezone offset minutes mantenido por la instancia.
   */
  timezoneOffsetMinutes?: number;
  /**
   * Identificador asociado a country concept.
   */
  countryConceptId?: string;
  /**
   * Valor de region coarse mantenido por la instancia.
   */
  regionCoarse?: string;
  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  ipPrefixHash?: string;
  /**
   * Valor de user agent hash mantenido por la instancia.
   */
  userAgentHash?: string;
  /**
   * Valor de is bot mantenido por la instancia.
   */
  isBot?: boolean;
  /**
   * Identificador asociado a data classification concept.
   */
  dataClassificationConceptId: string;
}

/** Acceso a `telemetry.client_contexts`. */
@Injectable()
export class ClientContextsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ClientContexts | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ClientContexts | null> {
    return em.findOne(ClientContexts, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ClientContexts`.
   */
  create(em: EntityManager, data: CreateClientContextData): ClientContexts {
    return em.create(
      ClientContexts,
      {
        sessionJourneyId: data.sessionJourneyId,
        analyticsSubjectId: data.analyticsSubjectId,
        sessionId: data.sessionId,
        portalTypeConceptId: data.portalTypeConceptId,
        deviceTypeConceptId: data.deviceTypeConceptId,
        osFamilyConceptId: data.osFamilyConceptId,
        browserFamilyConceptId: data.browserFamilyConceptId,
        appVersion: data.appVersion,
        screenClass: data.screenClass,
        viewportBucket: data.viewportBucket,
        locale: data.locale,
        timezoneOffsetMinutes: data.timezoneOffsetMinutes,
        countryConceptId: data.countryConceptId,
        regionCoarse: data.regionCoarse,
        ipPrefixHash: data.ipPrefixHash,
        userAgentHash: data.userAgentHash,
        isBot: data.isBot,
        dataClassificationConceptId: data.dataClassificationConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
