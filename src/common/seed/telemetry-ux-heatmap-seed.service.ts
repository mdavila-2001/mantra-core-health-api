import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ActivityEventSchemaDefinitions,
  TrackingPurposeDefinitions,
} from '../../modules/telemetry/entities';
import { TELE } from '../../modules/telemetry/telemetry.concepts';
import { CONCEPTS, SEED } from '../constants/concepts';

/** Nombre del propósito, tal como lo vería quien administra el tracking. */
const PURPOSE_NAME = 'Mapas de calor del portal';

/** Nombre base del esquema; el portal manda el tipo en `eventName`. */
const SCHEMA_EVENT_NAME = 'ux_interaccion';

/**
 * Siembra el propósito de tracking y el esquema de evento de los mapas de calor
 * del portal web.
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
 * Las mismas filas que crearían esos dos endpoints con sus valores por defecto:
 * propósito de analítica con base legal **consentimiento** y
 * `requiresConsent = true`, y esquema del portal web sin PII ni PHI. **No**
 * fija una retención: cuántos días se conservan las interacciones es una
 * decisión de privacidad que nadie tomó todavía, y sembrar un número la daría
 * por tomada.
 *
 * ## Idempotencia
 *
 * Los dos ids son deterministas y cada fila se guarda sólo si falta. Si un
 * administrador ya registró el código `PORTAL_UX_HEATMAP` con otro id, no se
 * duplica: se avisa y no se siembra nada, porque dos propósitos con el mismo
 * código romperían el índice único.
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
   * @returns Cuántas filas insertó esta pasada, por nivel.
   */
  async run(): Promise<{
    /** Propósitos creados (0 ó 1). */
    purposes: number;
    /** Esquemas de evento creados (0 ó 1). */
    schemas: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    const counters = { purposes: 0, schemas: 0 };

    const purpose = await em.findOne(TrackingPurposeDefinitions, {
      id: SEED.uxHeatmapPurposeId,
    });
    if (!purpose) {
      const clash = await em.findOne(TrackingPurposeDefinitions, {
        purposeCode: SEED.uxHeatmapPurposeCode,
      });
      if (clash) {
        this.logger.warn(
          {
            event: 'seed.telemetry.ux_heatmap.code_taken',
            purposeCode: SEED.uxHeatmapPurposeCode,
            existingId: clash.id,
          },
          'El código de propósito de los mapas de calor ya existe con otro id; ' +
            'no se siembra. El frontend debe apuntar al esquema de ese propósito.',
        );
        return counters;
      }
      em.create(
        TrackingPurposeDefinitions,
        {
          id: SEED.uxHeatmapPurposeId,
          purposeCode: SEED.uxHeatmapPurposeCode,
          name: PURPOSE_NAME,
          purposeCategoryConceptId: TELE.PURPOSE_CATEGORY_ANALYTICS,
          legalBasisConceptId: TELE.LEGAL_BASIS_CONSENT,
          requiresConsent: true,
          permitsMarketingUse: false,
          permitsCrossTenantAggregation: false,
          versionNumber: 1,
          effectiveFrom: now,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
        },
        { partial: true },
      );
      counters.purposes += 1;
    }
    await em.flush();

    if (
      !(await em.findOne(ActivityEventSchemaDefinitions, {
        id: SEED.uxHeatmapEventSchemaId,
      }))
    ) {
      em.create(
        ActivityEventSchemaDefinitions,
        {
          id: SEED.uxHeatmapEventSchemaId,
          eventName: SCHEMA_EVENT_NAME,
          schemaVersion: 1,
          purposeDefinitionId: SEED.uxHeatmapPurposeId,
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
    }
    await em.flush();

    this.logger.info(
      { event: 'seed.telemetry.ux_heatmap', ...counters },
      'Propósito y esquema de los mapas de calor garantizados',
    );
    return counters;
  }
}
