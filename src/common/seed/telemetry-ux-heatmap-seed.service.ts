import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ActivityEventSchemaDefinitions,
  TrackingPurposeDefinitions,
} from '../../modules/telemetry/entities';
import { TELE } from '../../modules/telemetry/telemetry.concepts';
import { CONCEPTS, SEED } from '../constants/concepts';

/** Nombre del propósito, tal como lo vería quien administra el tracking. */
const PURPOSE_NAME = 'Mapas de calor del portal';

/** Propósito de uso agregado de la plataforma (sin consentimiento, sin sujeto). */
const AGGREGATE_PURPOSE_NAME = 'Uso agregado de la plataforma';

/**
 * Cuántos días se conserva el uso agregado anónimo. Corto a propósito: no hay
 * sujeto que pueda retirar un consentimiento, así que el plazo es la garantía.
 */
const AGGREGATE_RETENTION_DAYS = 90;

/** Nombre base del esquema; el portal manda el tipo en `eventName`. */
const SCHEMA_EVENT_NAME = 'ux_interaccion';

/** Esquema de la vista de página anónima. */
const ANONYMOUS_PAGE_VIEW_EVENT_NAME = 'pagina_vista_anonima';

const numero = (minimum: number, maximum: number) => ({
  type: 'number',
  minimum,
  maximum,
});
const entero = (minimum: number, maximum: number) => ({
  type: 'integer',
  minimum,
  maximum,
});
const texto = (maxLength: number) => ({ type: 'string', maxLength });
const booleano = { type: 'boolean' };

/**
 * Propiedades que el SDK del portal puede mandar (`ux-events.ts` del front más
 * las del mapa de calor: clic muerto, parte de la interfaz y pestaña).
 *
 * Las coordenadas van normalizadas (0–1) para que se puedan sumar clics de
 * pantallas de 360 y de 1920 píxeles; sólo `y_doc_px` va en píxeles del
 * documento y se normaliza al consultar con `alto_doc_px`. Nada aquí es dato
 * personal: `objetivo` es un selector estable y la política del servidor
 * rechaza todavía correos y corridas de 7 o más dígitos.
 */
export const UX_INTERACTION_PROPERTY_SCHEMA = {
  type: 'object',
  properties: {
    // Lienzo
    ancho_vp: entero(0, 20_000),
    alto_vp: entero(0, 20_000),
    alto_doc_px: entero(0, 1_000_000),
    tamano_pantalla: {
      type: 'string',
      enum: ['movil', 'tableta', 'escritorio'],
    },
    // Navegación y página
    ruta_anterior: texto(300),
    pestana: texto(36),
    profundidad_max: numero(0, 1),
    ms_en_pagina: entero(0, 86_400_000),
    clics: entero(0, 100_000),
    // Clic
    objetivo: texto(300),
    data_part: texto(120),
    es_interactivo: booleano,
    es_teclado: booleano,
    es_clic_repetido: booleano,
    es_clic_muerto: booleano,
    x_doc: numero(0, 1),
    y_doc_px: entero(0, 1_000_000),
    x_vp: numero(0, 1),
    y_vp: numero(0, 1),
    objetivo_x: numero(0, 1),
    objetivo_y: numero(0, 1),
    // Foco de campo
    tipo_campo: texto(40),
  },
} as const;

/**
 * Esquema de la vista anónima: no declara ninguna propiedad, así que sólo
 * entra la plantilla de ruta (que no es una propiedad).
 */
export const ANONYMOUS_PAGE_VIEW_PROPERTY_SCHEMA = {
  type: 'object',
  properties: {},
} as const;

/** Lo que una pasada del seeder insertó o cambió. */
export interface TelemetryUxHeatmapSeedCounters {
  /** Propósitos creados. */
  purposes: number;
  /** Esquemas de evento creados. */
  schemas: number;
  /** Esquemas que pasaron a `DEPRECATED`. */
  deprecated: number;
}

/**
 * Siembra los propósitos de tracking y los esquemas de evento de los mapas de
 * calor del portal web y del uso agregado de la plataforma.
 *
 * ## Por qué hacía falta
 *
 * `POST /telemetry/activity-events` exige en cada evento un
 * `eventSchemaDefinitionId` registrado, y el gate de consentimiento valida
 * contra el propósito de ese esquema. Los dos sólo se creaban con
 * `POST /telemetry/tracking-purposes` y `POST /telemetry/event-schemas`
 * (`SECURITY_ADMIN`), y el id resultante había que copiarlo al entorno del
 * frontend: un despliegue nuevo no capturaba nada hasta que alguien lo hiciera.
 *
 * ## Qué siembra, y qué no
 *
 * - `PORTAL_UX_HEATMAP`: base legal **consentimiento**, `requiresConsent = true`.
 *   **No** fija una retención: cuántos días se conservan las interacciones es
 *   una decisión de privacidad que nadie tomó todavía.
 * - `ux_interaccion` **v2**, con el `propertySchemaJson` completo. La v1 se
 *   sembró sin propiedades declaradas y la política rechaza toda propiedad no
 *   declarada, así que no podía guardar ni un clic; los esquemas se versionan
 *   (no se editan), por eso la v1 queda `DEPRECATED` y el portal usa la v2.
 * - `PLATFORM_USAGE_AGGREGATE`: interés legítimo, **sin** consentimiento,
 *   retención de 90 días, agregable entre tenants; y `pagina_vista_anonima`,
 *   que no admite propiedades. El servicio guarda esos eventos sin usuario,
 *   sesión ni sujeto.
 *
 * ## Idempotencia
 *
 * Todos los ids son deterministas y cada fila se guarda sólo si falta; la v1 se
 * deprecia sólo si todavía no lo está. Una segunda pasada devuelve todo en 0.
 * Si un administrador ya registró un código de propósito con otro id, no se
 * duplica: se avisa y no se siembra lo que cuelga de él, porque dos propósitos
 * con el mismo código romperían el índice único.
 */
@Injectable()
export class TelemetryUxHeatmapSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - De donde sale el contexto de persistencia bifurcado.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryUxHeatmapSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que `yarn seed:boot` y el arnés de
   * integración puedan garantizarlo por su cuenta.
   *
   * @returns Cuántas filas insertó o cambió esta pasada, por nivel.
   */
  async run(): Promise<TelemetryUxHeatmapSeedCounters> {
    const em = this.orm.em.fork();
    const now = new Date();
    const counters: TelemetryUxHeatmapSeedCounters = {
      purposes: 0,
      schemas: 0,
      deprecated: 0,
    };

    const heatmapUsable = await this.ensurePurpose(em, counters, now, {
      id: SEED.uxHeatmapPurposeId,
      purposeCode: SEED.uxHeatmapPurposeCode,
      name: PURPOSE_NAME,
      legalBasisConceptId: TELE.LEGAL_BASIS_CONSENT,
      requiresConsent: true,
      permitsCrossTenantAggregation: false,
    });
    if (heatmapUsable) {
      await this.ensureSchema(em, counters, now, {
        id: SEED.uxHeatmapEventSchemaV2Id,
        eventName: SCHEMA_EVENT_NAME,
        schemaVersion: 2,
        purposeDefinitionId: SEED.uxHeatmapPurposeId,
        propertySchemaJson: UX_INTERACTION_PROPERTY_SCHEMA,
      });
      await this.deprecateV1(em, counters, now);
    }

    const aggregateUsable = await this.ensurePurpose(em, counters, now, {
      id: SEED.platformUsageAggregatePurposeId,
      purposeCode: SEED.platformUsageAggregatePurposeCode,
      name: AGGREGATE_PURPOSE_NAME,
      legalBasisConceptId: TELE.LEGAL_BASIS_LEGITIMATE_INTEREST,
      requiresConsent: false,
      permitsCrossTenantAggregation: true,
      defaultRetentionDays: AGGREGATE_RETENTION_DAYS,
    });
    if (aggregateUsable) {
      await this.ensureSchema(em, counters, now, {
        id: SEED.pageViewAnonymousEventSchemaId,
        eventName: ANONYMOUS_PAGE_VIEW_EVENT_NAME,
        schemaVersion: 1,
        purposeDefinitionId: SEED.platformUsageAggregatePurposeId,
        propertySchemaJson: ANONYMOUS_PAGE_VIEW_PROPERTY_SCHEMA,
      });
    }

    this.logger.info(
      { event: 'seed.telemetry.ux_heatmap', ...counters },
      'Propósitos y esquemas de los mapas de calor y del uso agregado garantizados',
    );
    return counters;
  }

  /**
   * Crea el propósito si falta.
   *
   * @returns `false` si el código ya existe con otro id (no se siembra nada de él).
   */
  private async ensurePurpose(
    em: EntityManager,
    counters: TelemetryUxHeatmapSeedCounters,
    now: Date,
    purpose: {
      /** Id determinista. */
      id: string;
      /** Código único del propósito. */
      purposeCode: string;
      /** Nombre legible. */
      name: string;
      /** Base legal. */
      legalBasisConceptId: string;
      /** Si el gate exige consentimiento. */
      requiresConsent: boolean;
      /** Si puede agregarse entre tenants. */
      permitsCrossTenantAggregation: boolean;
      /** Retención; sin valor, no se fija ninguna. */
      defaultRetentionDays?: number;
    },
  ): Promise<boolean> {
    if (await em.findOne(TrackingPurposeDefinitions, { id: purpose.id })) {
      return true;
    }
    const clash = await em.findOne(TrackingPurposeDefinitions, {
      purposeCode: purpose.purposeCode,
    });
    if (clash) {
      this.logger.warn(
        {
          event: 'seed.telemetry.ux_heatmap.code_taken',
          purposeCode: purpose.purposeCode,
          existingId: clash.id,
        },
        'El código de propósito ya existe con otro id; no se siembra. ' +
          'El frontend debe apuntar al esquema de ese propósito.',
      );
      return false;
    }
    em.create(
      TrackingPurposeDefinitions,
      {
        ...purpose,
        purposeCategoryConceptId: TELE.PURPOSE_CATEGORY_ANALYTICS,
        permitsMarketingUse: false,
        versionNumber: 1,
        effectiveFrom: now,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
      },
      { partial: true },
    );
    counters.purposes += 1;
    await em.flush();
    return true;
  }

  /** Crea el esquema de evento si falta. */
  private async ensureSchema(
    em: EntityManager,
    counters: TelemetryUxHeatmapSeedCounters,
    now: Date,
    schema: {
      /** Id determinista. */
      id: string;
      /** Nombre del evento. */
      eventName: string;
      /** Versión del esquema. */
      schemaVersion: number;
      /** Propósito del que cuelga. */
      purposeDefinitionId: string;
      /** Propiedades admitidas. */
      propertySchemaJson: unknown;
    },
  ): Promise<void> {
    if (await em.findOne(ActivityEventSchemaDefinitions, { id: schema.id })) {
      return;
    }
    em.create(
      ActivityEventSchemaDefinitions,
      {
        ...schema,
        portalTypeConceptId: TELE.PORTAL_WEB,
        piiClassificationConceptId: TELE.PII_NONE,
        phiAllowed: false,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        effectiveFrom: now,
        createdAt: now,
      },
      { partial: true },
    );
    counters.schemas += 1;
    await em.flush();
  }

  /** Marca la v1 de `ux_interaccion` como `DEPRECATED`, una sola vez. */
  private async deprecateV1(
    em: EntityManager,
    counters: TelemetryUxHeatmapSeedCounters,
    now: Date,
  ): Promise<void> {
    const v1 = await em.findOne(ActivityEventSchemaDefinitions, {
      id: SEED.uxHeatmapEventSchemaId,
    });
    if (!v1 || v1.statusConceptId === TELE.SCHEMA_DEPRECATED) return;
    v1.statusConceptId = TELE.SCHEMA_DEPRECATED;
    v1.effectiveTo = now;
    counters.deprecated += 1;
    await em.flush();
  }
}
