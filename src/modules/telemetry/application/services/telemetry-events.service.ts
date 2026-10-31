import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomUUID } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import {
  TELE,
  METRIC_CONCEPT_BY_CODE,
  RATING_CONCEPT_BY_CODE,
  VALUE_TYPE_CONCEPT_BY_CODE,
} from '../../telemetry.concepts';
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
  TrackingPurposeDefinitionsRepository,
  ActorSessionsRepository,
} from '../../infrastructure/repositories';
import type {
  AnalyticsSubjects,
  ClientContexts,
  SessionJourneys,
  UserActivityEvents,
} from '../../entities';
import { TelemetryErrorReason } from '../../telemetry.error-reasons';
import {
  EventPropertyRejection,
  validateEventProperties,
  isAnonymousSafeRouteTemplate,
  type EventSchemaPolicy,
  type RawEventProperty,
  type ValidatedEventProperty,
} from '../../domain/event-property-policy';
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
} from '../../presentation/dto';

/**
 * Nombre de evento que el esquema anónimo conserva tal cual para que el
 * conteo de vistas de página sume las identificadas y las anónimas.
 */
const ANONYMOUS_PAGE_VIEW_ALIAS = 'pagina_vista';

/**
 * Ingesta de telemetría consent-aware: captura de eventos de actividad en batch
 * (UC-28-07), contexto de cliente + journey (UC-28-08), Core Web Vitals (UC-28-09),
 * conversiones con atribución (UC-28-11) y cierre de journey (UC-28-13).
 *
 * Las tablas de eventos son append-only; los journeys se materializan/actualizan
 * bajo la misma transacción (row_version optimista lo gestiona MikroORM).
 *
 * ## Consentimiento y uso agregado
 *
 * El gate respeta `requires_consent` del propósito del esquema. Un propósito
 * que **no** lo exige (`PLATFORM_USAGE_AGGREGATE`) admite el evento sin decisión
 * del usuario, pero sólo en su forma anónima: sin sujeto, sin journey, con
 * `user_id` y `session_id` nulos y sin reenvío externo. Si el evento trae
 * sujeto o journey deja de ser anónimo y vuelve a exigir `GRANTED`; un propósito
 * sin dato de `requires_consent` se trata como si lo exigiera.
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
   * @param purposesRepo - Propósitos de tracking: dicen si el gate exige consentimiento.
   * @param sessionsRepo - Traduce el `sid` del token a la sesión y comprueba de quién es.
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
    private readonly purposesRepo: TrackingPurposeDefinitionsRepository,
    private readonly sessionsRepo: ActorSessionsRepository,
    private readonly webAnalytics: TelemetryWebAnalyticsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryEventsService.name);
  }

  /**
   * UC-28-07: captura un batch de eventos aplicando el gate de consentimiento.
   *
   * La identidad (`userId`, sesión y tenant) sale del actor autenticado y del
   * contexto de tenant, nunca del cuerpo. Las referencias que sí vienen del
   * cuerpo (sujeto, journey) deben ser del mismo actor; una ajena responde 404
   * igual que una inexistente y revierte el lote entero.
   */
  async captureActivityEvents(
    dto: CaptureActivityEventsDto,
    actor: AuthenticatedUser,
  ): Promise<ActivityEventsResponseDto> {
    this.logger.info(
      { operation: 'telemetry.activity.capture', count: dto.events.length },
      'Capturing activity events',
    );
    const forwarded: ForwardedActivityEvent[] = [];
    const tenantId = getCurrentTenantId();
    const response = await this.em.transactional(async (tx) => {
      const eventIds: string[] = [];
      let skipped = 0;
      let journey: SessionJourneys | null = null;
      const sessionId = await this.actorSessionId(tx, actor);

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

        if (schema.statusConceptId === TELE.SCHEMA_DEPRECATED) {
          throw new PreconditionFailedException(
            'El esquema de evento está obsoleto; use la versión vigente',
            { eventSchemaDefinitionId: item.eventSchemaDefinitionId },
            TelemetryErrorReason.EVENT_SCHEMA_NOT_ACTIVE,
          );
        }

        // Referencias del cuerpo: se comprueban antes del gate y antes de
        // crear nada, para que una ajena no pase por «descartada».
        if (item.analyticsSubjectId) {
          await this.assertOwnedSubject(tx, item.analyticsSubjectId, actor);
        }
        const explicitJourney = item.sessionJourneyId
          ? await this.assertOwnedJourney(tx, item.sessionJourneyId, actor)
          : null;

        // Uso agregado: el propósito no exige consentimiento Y el evento no
        // identifica a nadie (sin sujeto ni journey). Cualquier otro evento
        // es del actor y pasa por el gate.
        const anonymous =
          !item.analyticsSubjectId &&
          !item.sessionJourneyId &&
          (await this.purposeAllowsAnonymous(tx, schema.purposeDefinitionId));

        // Gate de consentimiento: el evento es siempre del actor y el propósito
        // exige una decisión efectiva GRANTED; si la última es WITHDRAWN se descarta.
        if (
          !anonymous &&
          !(await this.consentAllows(tx, actor.id, schema.purposeDefinitionId))
        ) {
          skipped += 1;
          continue;
        }
        if (anonymous && !isAnonymousSafeRouteTemplate(item.routeTemplate)) {
          throw new DomainException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.VALIDATION_FAILED,
            'El evento de uso agregado necesita una plantilla de ruta sin identificadores',
            { eventName: schema.eventName },
            TelemetryErrorReason.ANONYMOUS_ROUTE_INVALID,
          );
        }

        // Idempotencia por clave **del mismo usuario**: descarta reenvíos.
        // Un evento anónimo no tiene usuario: su clave se acota a los anónimos.
        // La clave que elige el cliente nunca se guarda tal cual en un evento
        // anónimo: se acota con un hash a quien la envía y a su organización,
        // para que otra persona no pueda adelantarse con la misma clave y hacer
        // que se descarte un evento ajeno.
        const idemKey =
          item.eventIdempotencyKey === undefined
            ? randomUUID()
            : anonymous
              ? createHash('sha256')
                  .update(
                    `anon\u0000${actor.id}\u0000${tenantId}\u0000${item.eventIdempotencyKey}`,
                  )
                  .digest('hex')
              : item.eventIdempotencyKey;
        if (item.eventIdempotencyKey) {
          const dup = await this.eventsRepo.findByIdempotencyKey(
            tx,
            idemKey,
            anonymous ? null : actor.id,
          );
          if (dup) {
            skipped += 1;
            continue;
          }
        }

        // Gobernanza de propiedades (TEL-03): antes de crear nada. Lo que no
        // pasa la política ni se persiste ni se reenvía.
        const properties = this.validateProperties(schema, item.properties);

        // El evento anónimo no abre ni enlaza journey: la sesión lo identificaría.
        const eventJourney = anonymous
          ? null
          : (explicitJourney ??
            (await this.openJourney(tx, {
              sessionId,
              analyticsSubjectId: item.analyticsSubjectId,
              portalTypeConceptId: item.portalTypeConceptId,
            })));
        if (eventJourney) journey = eventJourney;
        // En el esquema anónimo sólo se respeta el alias `pagina_vista`.
        const eventName = anonymous
          ? item.eventName === ANONYMOUS_PAGE_VIEW_ALIAS
            ? ANONYMOUS_PAGE_VIEW_ALIAS
            : schema.eventName
          : (item.eventName ?? schema.eventName);

        const occurredAt = item.occurredAt
          ? new Date(item.occurredAt)
          : new Date();
        const event = this.eventsRepo.create(tx, {
          eventSchemaDefinitionId: item.eventSchemaDefinitionId,
          analyticsSubjectId: anonymous ? undefined : item.analyticsSubjectId,
          userId: anonymous ? undefined : actor.id,
          sessionId: anonymous ? undefined : sessionId,
          tenantId,
          portalTypeConceptId:
            item.portalTypeConceptId ??
            schema.portalTypeConceptId ??
            TELE.PORTAL_WEB,
          eventName,
          eventIdempotencyKey: idemKey,
          routeTemplate: item.routeTemplate,
          occurredAt,
          receivedAt: new Date(),
          correlationId: item.correlationId,
        });
        await tx.flush();
        eventIds.push(event.id);

        for (const prop of properties) {
          this.propertiesRepo.create(tx, {
            userActivityEventId: event.id,
            propertyName: prop.propertyName,
            valueTypeConceptId: VALUE_TYPE_CONCEPT_BY_CODE[prop.valueType],
            valueString: prop.valueString,
            valueNumber:
              prop.valueNumber !== undefined
                ? String(prop.valueNumber)
                : undefined,
            valueBoolean: prop.valueBoolean,
            // La clasificación la fija el servidor desde el esquema: la que
            // declare el cliente no participa.
            dataClassificationConceptId:
              (prop.sensitive ? schema.piiClassificationConceptId : null) ??
              TELE.DATA_CLASS_INTERNAL,
          });
        }

        if (eventJourney) {
          if (!eventJourney.entryEventId) eventJourney.entryEventId = event.id;
          eventJourney.exitEventId = event.id;
          eventJourney.eventCount = (eventJourney.eventCount ?? 0) + 1;
          eventJourney.updatedAt = new Date();
        }
        await tx.flush();

        // Lo anónimo no sale a la analítica externa: no hay quien lo consienta.
        if (anonymous) continue;
        forwarded.push({
          eventName,
          analyticsSubjectId: item.analyticsSubjectId,
          sessionJourneyId: eventJourney?.id,
          routeTemplate: item.routeTemplate,
          occurredAt,
          // Sólo llega aquí lo que pasó el gate: el evento es de un usuario
          // identificado con una decisión GRANTED vigente.
          consentGranted: true,
          properties: this.forwardableProperties(properties),
        });
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
    actor: AuthenticatedUser,
  ): Promise<ClientContextResponseDto> {
    this.logger.info(
      { operation: 'telemetry.context.capture' },
      'Capturing client context',
    );
    return this.em.transactional(async (tx) => {
      const sessionId = await this.actorSessionId(tx, actor);
      if (dto.analyticsSubjectId) {
        await this.assertOwnedSubject(tx, dto.analyticsSubjectId, actor);
      }
      const journey = dto.sessionJourneyId
        ? await this.assertOwnedJourney(tx, dto.sessionJourneyId, actor)
        : await this.openJourney(tx, {
            sessionId,
            analyticsSubjectId: dto.analyticsSubjectId,
            portalTypeConceptId: dto.portalTypeConceptId,
          });

      const context = this.contextsRepo.create(tx, {
        sessionJourneyId: journey.id,
        analyticsSubjectId: dto.analyticsSubjectId,
        sessionId,
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

      if (!journey.startedAt) journey.startedAt = new Date();
      journey.updatedAt = new Date();
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
    actor: AuthenticatedUser,
  ): Promise<WebVitalsResponseDto> {
    this.logger.info(
      { operation: 'telemetry.webvitals.record', count: dto.metrics.length },
      'Recording web vitals',
    );
    const forwarded: ForwardedWebVital[] = [];
    const response = await this.em.transactional(async (tx) => {
      const ids: string[] = [];
      // Referencias ya comprobadas en este lote: un batch repite journey y sujeto.
      const verified = new Set<string>();
      const once = async (
        kind: string,
        id: string | undefined,
        check: (id: string) => Promise<unknown>,
      ) => {
        if (!id || verified.has(`${kind}:${id}`)) return;
        await check(id);
        verified.add(`${kind}:${id}`);
      };
      for (const m of dto.metrics) {
        await once('journey', m.sessionJourneyId, (id) =>
          this.assertOwnedJourney(tx, id, actor),
        );
        await once('subject', m.analyticsSubjectId, (id) =>
          this.assertOwnedSubject(tx, id, actor),
        );
        await once('event', m.userActivityEventId, (id) =>
          this.assertOwnedEvent(tx, id, actor),
        );
        await once('context', m.clientContextId, (id) =>
          this.assertOwnedContext(tx, id, actor),
        );
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
    actor: AuthenticatedUser,
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
      // Sujeto, journey y evento de cierre: del mismo actor, antes de escribir.
      await this.assertOwnedSubject(tx, dto.analyticsSubjectId, actor);
      const journey = dto.sessionJourneyId
        ? await this.assertOwnedJourney(tx, dto.sessionJourneyId, actor)
        : null;
      if (dto.completionEventId) {
        await this.assertOwnedEvent(tx, dto.completionEventId, actor);
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

      if (journey) {
        journey.journeyStatusConceptId = TELE.JOURNEY_CONVERTED;
        journey.updatedAt = now;
        await tx.flush();
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
    actor: AuthenticatedUser,
  ): Promise<JourneyResponseDto> {
    this.logger.info(
      { operation: 'telemetry.journey.close', journeyId },
      'Closing session journey',
    );
    return this.em.transactional(async (tx) => {
      // Un journey ajeno responde igual que uno inexistente (404 uniforme).
      const journey = await this.assertOwnedJourney(tx, journeyId, actor);
      if (dto.exitEventId) {
        await this.assertOwnedEvent(tx, dto.exitEventId, actor);
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

  /**
   * `iam.sessions.id` de la sesión que respalda el token del actor.
   *
   * La sesión de telemetría es la autenticada: el cliente no la elige.
   */
  private async actorSessionId(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const id = actor.sessionId
      ? await this.sessionsRepo.findIdByToken(tx, actor.id, actor.sessionId)
      : null;
    if (!id) {
      throw new PreconditionFailedException(
        'La sesión autenticada no está registrada',
        undefined,
        TelemetryErrorReason.SESSION_NOT_RESOLVED,
      );
    }
    return id;
  }

  /** Journey del actor (su sesión); cualquier otro responde como inexistente. */
  private async assertOwnedJourney(
    tx: EntityManager,
    journeyId: string,
    actor: AuthenticatedUser,
  ): Promise<SessionJourneys> {
    const journey = await this.journeysRepo.findById(tx, journeyId);
    if (
      !journey ||
      !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))
    ) {
      throw new ResourceNotFoundException(
        'Journey de sesión no encontrado',
        undefined,
        TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE,
      );
    }
    return journey;
  }

  /** Sujeto de analítica del actor; cualquier otro responde como inexistente. */
  private async assertOwnedSubject(
    tx: EntityManager,
    subjectId: string,
    actor: AuthenticatedUser,
  ): Promise<AnalyticsSubjects> {
    const subject = await this.subjectsRepo.findById(tx, subjectId);
    if (!subject || subject.userId !== actor.id) {
      throw new ResourceNotFoundException(
        'Sujeto de analítica no encontrado',
        undefined,
        TelemetryErrorReason.SUBJECT_OUT_OF_SCOPE,
      );
    }
    return subject;
  }

  /** Evento del actor; cualquier otro responde como inexistente. */
  private async assertOwnedEvent(
    tx: EntityManager,
    eventId: string,
    actor: AuthenticatedUser,
  ): Promise<UserActivityEvents> {
    const event = await this.eventsRepo.findById(tx, eventId);
    if (!event || event.userId !== actor.id) {
      throw new ResourceNotFoundException(
        'Evento de actividad no encontrado',
        undefined,
        TelemetryErrorReason.EVENT_OUT_OF_SCOPE,
      );
    }
    return event;
  }

  /** Contexto de cliente de una sesión del actor; otro responde como inexistente. */
  private async assertOwnedContext(
    tx: EntityManager,
    contextId: string,
    actor: AuthenticatedUser,
  ): Promise<ClientContexts> {
    const context = await this.contextsRepo.findById(tx, contextId);
    if (
      !context ||
      !context.sessionId ||
      !(await this.sessionsRepo.belongsToUser(tx, context.sessionId, actor.id))
    ) {
      throw new ResourceNotFoundException(
        'Contexto de cliente no encontrado',
        undefined,
        TelemetryErrorReason.CONTEXT_OUT_OF_SCOPE,
      );
    }
    return context;
  }

  /** Journey abierto de la sesión autenticada; lo crea si no hay. */
  private async openJourney(
    tx: EntityManager,
    opts: {
      /**
       * `iam.sessions.id` de la sesión autenticada.
       */
      sessionId: string;
      /**
       * Sujeto de analítica ya comprobado como del actor.
       */
      analyticsSubjectId?: string;
      /**
       * Tipo de portal del journey.
       */
      portalTypeConceptId?: string;
    },
  ): Promise<SessionJourneys> {
    const open = await this.journeysRepo.findOpenBySession(tx, opts.sessionId);
    if (open) return open;

    const journey = this.journeysRepo.create(tx, {
      sessionId: opts.sessionId,
      analyticsSubjectId: opts.analyticsSubjectId,
      portalTypeConceptId: opts.portalTypeConceptId ?? TELE.PORTAL_WEB,
      journeyStatusConceptId: TELE.JOURNEY_OPEN,
      startedAt: new Date(),
    });
    await tx.flush();
    return journey;
  }

  /**
   * Aplica la política del esquema a las propiedades recibidas (TEL-03).
   *
   * El rechazo es un 422 con el nombre del esquema y la regla incumplida; ni el
   * nombre ni el valor de la propiedad salen en la respuesta ni en el log.
   */
  private validateProperties(
    schema: EventSchemaPolicy,
    properties: readonly RawEventProperty[] | undefined,
  ): ValidatedEventProperty[] {
    try {
      return validateEventProperties(schema, properties);
    } catch (error) {
      if (!(error instanceof EventPropertyRejection)) throw error;
      this.logger.warn(
        {
          operation: 'telemetry.activity.property_rejected',
          eventName: schema.eventName,
          rule: error.rule,
        },
        'Event property rejected by schema',
      );
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'Una propiedad del evento no está permitida por su esquema',
        { eventName: schema.eventName, rule: error.rule },
        TelemetryErrorReason.EVENT_PROPERTY_NOT_ALLOWED,
      );
    }
  }

  /**
   * `true` si el propósito declara expresamente que no exige consentimiento.
   * Un propósito inexistente o con `requires_consent` nulo exige consentimiento.
   */
  private async purposeAllowsAnonymous(
    tx: EntityManager,
    purposeDefinitionId: string,
  ): Promise<boolean> {
    const purpose = await this.purposesRepo.findById(tx, purposeDefinitionId);
    return purpose?.requiresConsent === false;
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
   * Arma el par nombre/valor que entiende la analítica externa **desde el
   * resultado validado**, no desde el DTO original. Sólo viajan las propiedades
   * que el esquema permite reenviar: lo sensible o marcado `forward: false` se
   * queda en el sistema. No se reenvía la clasificación del dato.
   */
  private forwardableProperties(
    properties: readonly ValidatedEventProperty[],
  ): Record<string, string | number | boolean> | undefined {
    const out: Record<string, string | number | boolean> = {};
    for (const property of properties) {
      if (!property.forwardable) continue;
      const value =
        property.valueString ?? property.valueNumber ?? property.valueBoolean;
      if (value !== undefined) out[property.propertyName] = value;
    }
    return Object.keys(out).length ? out : undefined;
  }
}
