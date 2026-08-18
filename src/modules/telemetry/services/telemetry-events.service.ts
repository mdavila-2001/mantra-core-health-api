import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  TELE,
  METRIC_CONCEPT_BY_CODE,
  RATING_CONCEPT_BY_CODE,
  VALUE_TYPE_CONCEPT_BY_CODE,
} from '../telemetry.concepts';
import {
  ActivityEventSchemaDefinitionsRepository,
  UserActivityEventsRepository,
  UserActivityEventPropertiesRepository,
  SessionJourneysRepository,
  ClientContextsRepository,
  WebVitalsRepository,
  FunnelDefinitionsRepository,
  ConversionEventsRepository,
  AnalyticsSubjectsRepository,
  TrackingConsentsRepository,
} from '../repositories';
import type { SessionJourneys } from '../entities';
import {
  TelemetryWebAnalyticsService,
  type ForwardedActivityEvent,
  type ForwardedWebVital,
} from './telemetry-web-analytics.service';
import {
  CaptureActivityEventsDto,
  ActivityEventsResponseDto,
  CreateClientContextDto,
  ClientContextResponseDto,
  RecordWebVitalsDto,
  WebVitalsResponseDto,
  CreateConversionEventDto,
  ConversionEventResponseDto,
  CloseJourneyDto,
  JourneyResponseDto,
} from '../dto';

/**
 * Ingesta de telemetría consent-aware: captura de eventos de actividad en batch
 * (UC-28-07), contexto de cliente + journey (UC-28-08), Core Web Vitals (UC-28-09),
 * conversiones con atribución (UC-28-11) y cierre de journey (UC-28-13).
 *
 * Las tablas de eventos son append-only; los journeys se materializan/actualizan
 * bajo la misma transacción (row_version optimista lo gestiona MikroORM).
 *
 * Lo que se persiste aquí se ofrece además a la analítica web externa
 * (`TelemetryWebAnalyticsService`) **después de confirmar la transacción** y
 * sólo si se persistió: lo que el gate de consentimiento descarta no se reenvía,
 * y un proveedor caído no cambia ni un byte de lo que se guardó ni de lo que se
 * responde al portal.
 */
@Injectable()
export class TelemetryEventsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param schemasRepo - Valor de schemas repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param propertiesRepo - Valor de properties repo requerido por la operación.
   * @param journeysRepo - Valor de journeys repo requerido por la operación.
   * @param contextsRepo - Valor de contexts repo requerido por la operación.
   * @param webVitalsRepo - Valor de web vitals repo requerido por la operación.
   * @param funnelsRepo - Valor de funnels repo requerido por la operación.
   * @param conversionsRepo - Valor de conversions repo requerido por la operación.
   * @param subjectsRepo - Valor de subjects repo requerido por la operación.
   * @param consentsRepo - Valor de consents repo requerido por la operación.
   * @param webAnalytics - Reenvío de mejor esfuerzo a la analítica web externa.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly schemasRepo: ActivityEventSchemaDefinitionsRepository,
    private readonly eventsRepo: UserActivityEventsRepository,
    private readonly propertiesRepo: UserActivityEventPropertiesRepository,
    private readonly journeysRepo: SessionJourneysRepository,
    private readonly contextsRepo: ClientContextsRepository,
    private readonly webVitalsRepo: WebVitalsRepository,
    private readonly funnelsRepo: FunnelDefinitionsRepository,
    private readonly conversionsRepo: ConversionEventsRepository,
    private readonly subjectsRepo: AnalyticsSubjectsRepository,
    private readonly consentsRepo: TrackingConsentsRepository,
    private readonly webAnalytics: TelemetryWebAnalyticsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryEventsService.name);
  }

  /** UC-28-07: captura un batch de eventos aplicando el gate de consentimiento. */
  async captureActivityEvents(
    dto: CaptureActivityEventsDto,
  ): Promise<ActivityEventsResponseDto> {
    this.logger.info(
      { operation: 'telemetry.activity.capture', count: dto.events.length },
      'Capturing activity events',
    );
    const forwarded: ForwardedActivityEvent[] = [];
    let tenantId: string | undefined;
    const response = await this.em.transactional(async (tx) => {
      const eventIds: string[] = [];
      let skipped = 0;
      let journey: SessionJourneys | null = null;

      for (const item of dto.events) {
        const schema = await this.schemasRepo.findById(
          tx,
          item.eventSchemaDefinitionId,
        );
        if (!schema) {
          throw new ResourceNotFoundException(
            'Esquema de evento no encontrado',
            {
              eventSchemaDefinitionId: item.eventSchemaDefinitionId,
            },
          );
        }

        // Gate de consentimiento: si hay usuario y el propósito lo requiere, exige
        // una decisión efectiva GRANTED; si la última es WITHDRAWN se descarta.
        if (
          item.userId &&
          !(await this.consentAllows(
            tx,
            item.userId,
            schema.purposeDefinitionId,
          ))
        ) {
          skipped += 1;
          continue;
        }

        // Idempotencia por clave: descarta reenvíos.
        const idemKey = item.eventIdempotencyKey ?? randomUUID();
        if (item.eventIdempotencyKey) {
          const dup = await this.eventsRepo.findByIdempotencyKey(tx, idemKey);
          if (dup) {
            skipped += 1;
            continue;
          }
        }

        journey = await this.resolveJourney(tx, {
          sessionJourneyId: item.sessionJourneyId,
          sessionId: item.sessionId,
          analyticsSubjectId: item.analyticsSubjectId,
          portalTypeConceptId: item.portalTypeConceptId,
        });

        const occurredAt = item.occurredAt
          ? new Date(item.occurredAt)
          : new Date();
        const event = this.eventsRepo.create(tx, {
          eventSchemaDefinitionId: item.eventSchemaDefinitionId,
          analyticsSubjectId: item.analyticsSubjectId,
          userId: item.userId,
          sessionId: item.sessionId,
          tenantId: item.tenantId,
          portalTypeConceptId:
            item.portalTypeConceptId ??
            schema.portalTypeConceptId ??
            TELE.PORTAL_WEB,
          eventName: item.eventName ?? schema.eventName,
          eventIdempotencyKey: idemKey,
          routeTemplate: item.routeTemplate,
          occurredAt,
          receivedAt: new Date(),
          correlationId: item.correlationId,
        });
        await tx.flush();
        eventIds.push(event.id);

        for (const prop of item.properties ?? []) {
          this.propertiesRepo.create(tx, {
            userActivityEventId: event.id,
            propertyName: prop.propertyName,
            valueTypeConceptId: this.valueType(prop),
            valueString: prop.valueString,
            valueNumber:
              prop.valueNumber !== undefined
                ? String(prop.valueNumber)
                : undefined,
            valueBoolean: prop.valueBoolean,
            dataClassificationConceptId:
              prop.dataClassificationConceptId ?? TELE.DATA_CLASS_INTERNAL,
          });
        }

        if (journey) {
          if (!journey.entryEventId) journey.entryEventId = event.id;
          journey.exitEventId = event.id;
          journey.eventCount = (journey.eventCount ?? 0) + 1;
          journey.updatedAt = new Date();
        }
        await tx.flush();

        forwarded.push({
          eventName: item.eventName ?? schema.eventName,
          analyticsSubjectId: item.analyticsSubjectId,
          sessionJourneyId: journey?.id,
          routeTemplate: item.routeTemplate,
          occurredAt,
          // Sólo llega aquí lo que pasó el gate: un evento con usuario
          // identificado implica una decisión GRANTED vigente.
          consentGranted: Boolean(item.userId),
          properties: this.forwardableProperties(item.properties),
        });
        tenantId ??= item.tenantId;
      }

      return {
        inserted: eventIds.length,
        skipped,
        eventIds,
        sessionJourneyId: journey?.id,
      };
    });

    this.webAnalytics.trackActivityEvents(forwarded, { tenantId });
    return response;
  }

  /** UC-28-08: registra el contexto de cliente y crea/enlaza el journey de sesión. */
  async captureClientContext(
    dto: CreateClientContextDto,
  ): Promise<ClientContextResponseDto> {
    this.logger.info(
      { operation: 'telemetry.context.capture' },
      'Capturing client context',
    );
    return this.em.transactional(async (tx) => {
      const journey = await this.resolveJourney(tx, {
        sessionJourneyId: dto.sessionJourneyId,
        sessionId: dto.sessionId,
        analyticsSubjectId: dto.analyticsSubjectId,
        portalTypeConceptId: dto.portalTypeConceptId,
        mustExist: dto.sessionJourneyId !== undefined,
      });

      const context = this.contextsRepo.create(tx, {
        sessionJourneyId: journey?.id,
        analyticsSubjectId: dto.analyticsSubjectId,
        sessionId: dto.sessionId,
        portalTypeConceptId: dto.portalTypeConceptId ?? TELE.PORTAL_WEB,
        deviceTypeConceptId: dto.deviceTypeConceptId,
        osFamilyConceptId: dto.osFamilyConceptId,
        browserFamilyConceptId: dto.browserFamilyConceptId,
        appVersion: dto.appVersion,
        screenClass: dto.screenClass,
        viewportBucket: dto.viewportBucket,
        locale: dto.locale,
        timezoneOffsetMinutes: dto.timezoneOffsetMinutes,
        countryConceptId: dto.countryConceptId,
        regionCoarse: dto.regionCoarse,
        ipPrefixHash: dto.ipPrefixHash,
        userAgentHash: dto.userAgentHash,
        isBot: dto.isBot ?? false,
        dataClassificationConceptId:
          dto.dataClassificationConceptId ?? TELE.DATA_CLASS_INTERNAL,
      });

      if (journey) {
        if (!journey.startedAt) journey.startedAt = new Date();
        journey.updatedAt = new Date();
      }
      await tx.flush();

      return {
        id: context.id,
        sessionJourneyId: journey.id,
        createdAt: context.createdAt,
      };
    });
  }

  /** UC-28-09: registra un batch de métricas Core Web Vitals por ruta. */
  async recordWebVitals(
    dto: RecordWebVitalsDto,
  ): Promise<WebVitalsResponseDto> {
    this.logger.info(
      { operation: 'telemetry.webvitals.record', count: dto.metrics.length },
      'Recording web vitals',
    );
    const forwarded: ForwardedWebVital[] = [];
    const response = await this.em.transactional(async (tx) => {
      const ids: string[] = [];
      for (const m of dto.metrics) {
        if (m.sessionJourneyId) {
          const j = await this.journeysRepo.findById(tx, m.sessionJourneyId);
          if (!j) {
            throw new ResourceNotFoundException(
              'Journey de sesión no encontrado',
              {
                sessionJourneyId: m.sessionJourneyId,
              },
            );
          }
        }
        const measuredAt = new Date();
        const vital = this.webVitalsRepo.create(tx, {
          userActivityEventId: m.userActivityEventId,
          sessionJourneyId: m.sessionJourneyId,
          analyticsSubjectId: m.analyticsSubjectId,
          clientContextId: m.clientContextId,
          portalTypeConceptId: m.portalTypeConceptId ?? TELE.PORTAL_WEB,
          routeTemplate: m.routeTemplate,
          metricConceptId: METRIC_CONCEPT_BY_CODE[m.metric] ?? TELE.METRIC_LCP,
          metricValue: String(m.metricValue),
          ratingConceptId: m.rating
            ? RATING_CONCEPT_BY_CODE[m.rating]
            : undefined,
          navigationTypeConceptId: TELE.NAV_NAVIGATE,
          measuredAt,
        });
        ids.push(vital.id);
        forwarded.push({
          metric: m.metric,
          metricValue: m.metricValue,
          rating: m.rating,
          routeTemplate: m.routeTemplate,
          analyticsSubjectId: m.analyticsSubjectId,
          sessionJourneyId: m.sessionJourneyId,
          measuredAt,
        });
      }
      await tx.flush();
      return { inserted: ids.length, ids };
    });

    this.webAnalytics.trackWebVitals(forwarded);
    return response;
  }

  /** UC-28-11: registra una conversión con atribución y marca el journey. */
  async recordConversion(
    dto: CreateConversionEventDto,
  ): Promise<ConversionEventResponseDto> {
    this.logger.info(
      {
        operation: 'telemetry.conversion.record',
        funnelDefinitionId: dto.funnelDefinitionId,
      },
      'Recording conversion',
    );
    const response = await this.em.transactional(async (tx) => {
      const funnel = await this.funnelsRepo.findById(
        tx,
        dto.funnelDefinitionId,
      );
      if (!funnel) {
        throw new ResourceNotFoundException('Funnel no encontrado', {
          funnelDefinitionId: dto.funnelDefinitionId,
        });
      }
      const subject = await this.subjectsRepo.findById(
        tx,
        dto.analyticsSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException(
          'Sujeto de analítica no encontrado',
          {
            analyticsSubjectId: dto.analyticsSubjectId,
          },
        );
      }

      const existing = await this.conversionsRepo.findExisting(
        tx,
        dto.funnelDefinitionId,
        dto.analyticsSubjectId,
        dto.sessionJourneyId,
      );
      // La conversión es idempotente por (funnel, sujeto, journey): reenviarla
      // duplicaría el evento clave en el proveedor, que no deduplica por su
      // cuenta. Por eso el `forward` sólo se prepara en la rama que crea.
      if (existing) {
        return {
          response: {
            id: existing.id,
            funnelDefinitionId: existing.funnelDefinitionId,
            analyticsSubjectId: existing.analyticsSubjectId,
            convertedAt: existing.convertedAt ?? existing.createdAt,
          },
          forward: undefined,
        };
      }

      const now = new Date();
      const conversion = this.conversionsRepo.create(tx, {
        funnelDefinitionId: dto.funnelDefinitionId,
        analyticsSubjectId: dto.analyticsSubjectId,
        sessionJourneyId: dto.sessionJourneyId,
        completionEventId: dto.completionEventId,
        convertedAt: now,
        attributionJson: dto.attributionJson,
      });
      await tx.flush();

      if (dto.sessionJourneyId) {
        const journey = await this.journeysRepo.findById(
          tx,
          dto.sessionJourneyId,
        );
        if (journey) {
          journey.journeyStatusConceptId = TELE.JOURNEY_CONVERTED;
          journey.updatedAt = now;
          await tx.flush();
        }
      }

      return {
        response: {
          id: conversion.id,
          funnelDefinitionId: conversion.funnelDefinitionId,
          analyticsSubjectId: conversion.analyticsSubjectId,
          convertedAt: now,
        },
        forward: {
          funnelCode: funnel.funnelCode,
          funnelVersion: funnel.versionNumber,
          analyticsSubjectId: dto.analyticsSubjectId,
          sessionJourneyId: dto.sessionJourneyId,
          convertedAt: now,
        },
      };
    });

    if (response.forward) this.webAnalytics.trackConversion(response.forward);
    return response.response;
  }

  /** UC-28-13: cierra un journey de sesión y consolida métricas. */
  async closeJourney(
    journeyId: string,
    dto: CloseJourneyDto,
  ): Promise<JourneyResponseDto> {
    this.logger.info(
      { operation: 'telemetry.journey.close', journeyId },
      'Closing session journey',
    );
    return this.em.transactional(async (tx) => {
      const journey = await this.journeysRepo.findById(tx, journeyId);
      if (!journey) {
        throw new ResourceNotFoundException('Journey de sesión no encontrado', {
          journeyId,
        });
      }
      if (journey.journeyStatusConceptId === TELE.JOURNEY_CLOSED) {
        throw new PreconditionFailedException('El journey ya está cerrado', {
          journeyId,
        });
      }

      const now = new Date();
      journey.endedAt = now;
      if (dto.exitEventId) journey.exitEventId = dto.exitEventId;
      if (dto.eventCount !== undefined) journey.eventCount = dto.eventCount;
      journey.journeyStatusConceptId = TELE.JOURNEY_CLOSED;
      journey.updatedAt = now;
      await tx.flush();

      return {
        id: journey.id,
        journeyStatusConceptId: journey.journeyStatusConceptId,
        endedAt: journey.endedAt,
        eventCount: journey.eventCount ?? 0,
      };
    });
  }

  /** Resuelve el journey por id o por sesión; lo crea si procede. */
  private async resolveJourney(
    tx: EntityManager,
    opts: {
      /**
       * Identificador asociado a session journey.
       */
      sessionJourneyId?: string;
      /**
       * Identificador asociado a session.
       */
      sessionId?: string;
      /**
       * Identificador asociado a analytics subject.
       */
      analyticsSubjectId?: string;
      /**
       * Identificador asociado a portal type concept.
       */
      portalTypeConceptId?: string;
      /**
       * Valor de must exist mantenido por la instancia.
       */
      mustExist?: boolean;
    },
  ): Promise<SessionJourneys> {
    if (opts.sessionJourneyId) {
      const found = await this.journeysRepo.findById(tx, opts.sessionJourneyId);
      if (!found) {
        throw new ResourceNotFoundException('Journey de sesión no encontrado', {
          sessionJourneyId: opts.sessionJourneyId,
        });
      }
      return found;
    }

    const sessionId = opts.sessionId ?? randomUUID();
    if (opts.sessionId) {
      const open = await this.journeysRepo.findOpenBySession(
        tx,
        opts.sessionId,
      );
      if (open) return open;
    }

    const journey = this.journeysRepo.create(tx, {
      sessionId,
      analyticsSubjectId: opts.analyticsSubjectId,
      portalTypeConceptId: opts.portalTypeConceptId ?? TELE.PORTAL_WEB,
      journeyStatusConceptId: TELE.JOURNEY_OPEN,
      startedAt: new Date(),
    });
    await tx.flush();
    return journey;
  }

  /** Gate de consentimiento efectivo para (user, purpose). */
  private async consentAllows(
    tx: EntityManager,
    userId: string,
    purposeDefinitionId: string,
  ): Promise<boolean> {
    const latest = await this.consentsRepo.findLatest(
      tx,
      userId,
      purposeDefinitionId,
    );
    return latest?.decisionConceptId === TELE.DECISION_GRANTED;
  }

  /**
   * Aplana las propiedades del evento al par nombre/valor que entiende la
   * analítica externa. No se reenvía la clasificación del dato ni ninguna
   * propiedad sin valor: lo que no aporta medida, no sale del sistema.
   */
  private forwardableProperties(
    properties:
      | {
          /**
           * Nombre de la propiedad.
           */
          propertyName: string;
          /**
           * Valor string, si lo trae.
           */
          valueString?: string;
          /**
           * Valor numérico, si lo trae.
           */
          valueNumber?: number;
          /**
           * Valor booleano, si lo trae.
           */
          valueBoolean?: boolean;
        }[]
      | undefined,
  ): Record<string, string | number | boolean> | undefined {
    if (!properties?.length) return undefined;
    const out: Record<string, string | number | boolean> = {};
    for (const property of properties) {
      const value =
        property.valueString ?? property.valueNumber ?? property.valueBoolean;
      if (value !== undefined) out[property.propertyName] = value;
    }
    return Object.keys(out).length ? out : undefined;
  }

  /** Determina el concepto de tipo de valor de una propiedad. */
  private valueType(prop: {
    /**
     * Valor de value type mantenido por la instancia.
     */
    valueType?: 'STRING' | 'NUMBER' | 'BOOLEAN';
    /**
     * Valor de value number mantenido por la instancia.
     */
    valueNumber?: number;
    /**
     * Valor de value boolean mantenido por la instancia.
     */
    valueBoolean?: boolean;
  }): string {
    if (prop.valueType) return VALUE_TYPE_CONCEPT_BY_CODE[prop.valueType];
    if (prop.valueNumber !== undefined) return TELE.VALUE_TYPE_NUMBER;
    if (prop.valueBoolean !== undefined) return TELE.VALUE_TYPE_BOOLEAN;
    return TELE.VALUE_TYPE_STRING;
  }
}
