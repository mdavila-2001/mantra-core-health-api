import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClientContexts } from '../entities';

/** Datos de un contexto de cliente (UC-28-08). */
export interface CreateClientContextData {
  sessionJourneyId?: string;
  analyticsSubjectId?: string;
  sessionId?: string;
  portalTypeConceptId: string;
  deviceTypeConceptId?: string;
  osFamilyConceptId?: string;
  browserFamilyConceptId?: string;
  appVersion?: string;
  screenClass?: string;
  viewportBucket?: string;
  locale?: string;
  timezoneOffsetMinutes?: number;
  countryConceptId?: string;
  regionCoarse?: string;
  ipPrefixHash?: string;
  userAgentHash?: string;
  isBot?: boolean;
  dataClassificationConceptId: string;
}

/** Acceso a `telemetry.client_contexts`. */
@Injectable()
export class ClientContextsRepository {
  findById(em: EntityManager, id: string): Promise<ClientContexts | null> {
    return em.findOne(ClientContexts, { id });
  }

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
