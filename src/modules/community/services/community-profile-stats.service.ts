import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisRuntimeService } from '../../redis_runtime/services';
import type { ProfileStatsDto } from '../dto';

/** Días que cubre «tu perfil esta semana». */
const WINDOW_DAYS = 7;

/**
 * Cuánto vive un contador diario. Ocho días: la ventana de siete más uno de
 * margen, para que el día más viejo no se evapore mientras se lo está leyendo.
 */
const COUNTER_TTL_SEC = 8 * 24 * 3_600;

/** Qué se cuenta. Dos cosas distintas: aparecer y que te abran. */
type Signal = 'view' | 'impression';

/**
 * Estadísticas del perfil público (`ORG-PUB-005`).
 *
 * ## Qué resuelve
 *
 * El profesional publicaba su vitrina y **no tenía forma de saber si servía
 * de algo**. La telemetría ya reenvía a GA4 desde el PR #124, pero el dueño del
 * perfil no ve nada: el dato existe y no llega a quien le importa.
 *
 * ## Por qué Redis y no una tabla
 *
 * Un contador por perfil y día es exactamente la forma que Redis hace bien, y
 * es el mismo mecanismo que el módulo ya prevé para sus contadores sociales
 * (la reconciliación contra Redis de P12). Una tabla nueva sería esquema, que
 * no es de este carril; y una fila por visita sería guardar el rastro de cada
 * visitante anónimo para poder contarlos, que es justo lo que no hay que hacer.
 *
 * ## Sin PII del visitante
 *
 * Se guarda **un número por perfil y día**. No hay id de visitante, ni IP, ni
 * sesión, ni user-agent: no porque no haga falta, sino porque un contador de
 * visitas no justifica un registro de quién miró el perfil de qué médico. Como
 * consecuencia el número es de visitas y no de visitantes únicos, y así se
 * rotula.
 *
 * ## Nunca rompe la página
 *
 * `record` no se espera y sus fallos se tragan: la ficha pública de un
 * profesional no puede caerse porque Redis esté ocupado. Un contador que se
 * pierde es un dato menos; una ficha que no carga es un paciente menos.
 */
@Injectable()
export class CommunityProfileStatsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param redis - Contadores con ventana.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly redis: RedisRuntimeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityProfileStatsService.name);
  }

  /**
   * Anota una visita a la ficha pública. No se espera y no puede fallar hacia
   * afuera.
   *
   * @param tenantId - Tenant del perfil.
   * @param profileId - Perfil visitado.
   */
  recordView(tenantId: string, profileId: string): void {
    this.record(tenantId, profileId, 'view');
  }

  /**
   * Anota que el perfil apareció en una página de resultados.
   *
   * Aparecer no es lo mismo que ser abierto, y separarlos es lo que permite
   * decir algo útil: «apareciste 200 veces y te abrieron 3» es un problema de
   * la tarjeta, no de la búsqueda.
   *
   * @param tenantId - Tenant del perfil.
   * @param profileIds - Perfiles servidos en la página.
   */
  recordImpressions(tenantId: string, profileIds: readonly string[]): void {
    for (const profileId of profileIds) {
      this.record(tenantId, profileId, 'impression');
    }
  }

  /**
   * «Tu perfil esta semana»: visitas y apariciones, con el detalle por día.
   *
   * @param tenantId - Tenant del perfil.
   * @param profileId - Perfil del que se piden las estadísticas.
   * @param hoy - Día de referencia (inyectable para las pruebas).
   * @returns Totales de la ventana y su desglose diario.
   */
  async read(
    tenantId: string,
    profileId: string,
    hoy: Date = new Date(),
  ): Promise<ProfileStatsDto> {
    const dias = this.ultimosDias(hoy);
    const claves = [
      ...dias.map((dia) => this.key(profileId, 'view', dia)),
      ...dias.map((dia) => this.key(profileId, 'impression', dia)),
    ];

    let valores: Map<string, number>;
    try {
      valores = await this.redis.getCounters(tenantId, claves);
    } catch (error) {
      // Sin Redis no hay estadísticas, pero tampoco un 500: la pantalla del
      // profesional muestra ceros y un rótulo, no un error.
      this.logger.warn(
        {
          operation: 'community.profile.stats',
          err: error instanceof Error ? error.message : String(error),
        },
        'Counters unavailable: profile stats served as zeroes',
      );
      valores = new Map();
    }

    const daily = dias.map((dia) => ({
      date: dia,
      views: valores.get(this.key(profileId, 'view', dia)) ?? 0,
      searchAppearances:
        valores.get(this.key(profileId, 'impression', dia)) ?? 0,
    }));

    return {
      windowDays: WINDOW_DAYS,
      views: daily.reduce((total, dia) => total + dia.views, 0),
      searchAppearances: daily.reduce(
        (total, dia) => total + dia.searchAppearances,
        0,
      ),
      daily,
    };
  }

  // --- Internos -------------------------------------------------------------

  /** Incrementa el contador del día sin bloquear ni propagar fallos. */
  private record(tenantId: string, profileId: string, signal: Signal): void {
    if (!tenantId || !profileId) return;

    const key = this.key(profileId, signal, this.dia(new Date()));
    void this.redis
      .incrWithWindow(tenantId, key, COUNTER_TTL_SEC)
      .catch((error: unknown) => {
        this.logger.warn(
          {
            operation: 'community.profile.stats',
            signal,
            err: error instanceof Error ? error.message : String(error),
          },
          'Profile counter not recorded',
        );
      });
  }

  /** Clave del contador: perfil, señal y día. Nada del visitante. */
  private key(profileId: string, signal: Signal, dia: string): string {
    return `profile-stats:${profileId}:${signal}:${dia}`;
  }

  /** El día en `YYYY-MM-DD`, en UTC para que el corte no dependa del servidor. */
  private dia(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }

  /** Los últimos `WINDOW_DAYS` días, del más viejo al más nuevo. */
  private ultimosDias(hoy: Date): string[] {
    const dias: string[] = [];
    for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
      const fecha = new Date(hoy.getTime() - i * 24 * 3_600_000);
      dias.push(this.dia(fecha));
    }
    return dias;
  }
}
