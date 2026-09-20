// Esta suite NO compone la app —le alcanza con la guarda y la base—, así que
// nadie carga `.env` por ella: hay que pedirlo explícitamente o la conexión
// sale sin contraseña.
import 'dotenv/config';
import pg from 'pg';
import {
  assertOutboundUrlAllowed,
  isBlockedAddress,
  resolveOutboundDestination,
} from '../../src/common/http/ssrf-guard';

/**
 * Ningún doble y ninguna prueba pueden producir una salida real
 * (carril B, H5.S1.M2).
 *
 * ## Qué pide el DoD, y qué NO pide
 *
 * Pide **intentar** una salida a un destinatario real o a una red no
 * permitida y comprobar que **se bloquea**. No pide mandar nada: una prueba
 * que consigue entregarle algo a una persona real es exactamente el accidente
 * que este hito existe para impedir.
 *
 * Al cierre del turno anterior esta microtarea quedó `BLOQUEADO` con el motivo
 * «exigiría apuntar a un proveedor real». Era una lectura equivocada del
 * propio DoD: lo que hay que observar es el bloqueo, y el bloqueo se puede
 * observar sin mandar nada.
 *
 * ## Las dos barreras que existen de verdad en este repo
 *
 * 1. **La guarda anti-SSRF** (`src/common/http/ssrf-guard.ts`), que el
 *    despachador HTTP aplica antes de cada `POST` saliente.
 * 2. **La configuración viva**: todos los destinos declarados usan dominios
 *    reservados por la RFC 2606 (`.invalid`), que por definición **no
 *    resuelven en ningún DNS del mundo**. No es una convención de nombres: es
 *    la garantía de que un despacho no puede llegar a un tercero real.
 *
 * Las dos se comprueban acá, con el código real y contra la base viva.
 */

/** Conexión independiente: se mira la configuración que la app usaría de verdad. */
function conexionIndependiente(): pg.Client {
  return new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
}

/** Dominios que ninguna resolución puede convertir en un host real (RFC 2606/6761). */
const TLD_RESERVADOS = /\.(invalid|example|test|localhost)(\/|$|:)/;

describe('La salida real está bloqueada (H5.S1.M2)', () => {
  let sql: pg.Client;

  beforeAll(async () => {
    sql = conexionIndependiente();
    await sql.connect();
  }, 60_000);

  afterAll(async () => {
    await sql.end();
  });

  describe('barrera 1 · la guarda anti-SSRF rechaza la red no permitida', () => {
    // Cada caso es una red que un despacho jamás debe alcanzar desde acá.
    const destinosProhibidos: ReadonlyArray<[string, string]> = [
      ['loopback por IP', 'http://127.0.0.1:4100/notifications'],
      ['loopback por nombre', 'http://localhost:4100/notifications'],
      ['metadatos de la nube', 'http://169.254.169.254/latest/meta-data/'],
      ['red privada', 'http://10.0.0.5/webhooks/entrega'],
      ['red privada 192.168', 'http://192.168.1.10/webhooks/entrega'],
    ];

    /**
     * Ejerce la política con el entorno que la activa.
     *
     * `assertOutboundUrlAllowed` **retorna sin mirar nada** cuando
     * `NODE_ENV !== 'production'`: está escrito y comentado en el guard
     * («En dev/test se permite apuntar a hosts privados»). Probarla con el
     * `NODE_ENV` de la corrida mediría el bypass, no la política.
     */
    function conEntornoDeProduccion<T>(accion: () => T): T {
      const previo = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        return accion();
      } finally {
        process.env.NODE_ENV = previo;
      }
    }

    it.each(destinosProhibidos)('bloquea %s', (_nombre, url) => {
      conEntornoDeProduccion(() => {
        expect(() => assertOutboundUrlAllowed(url)).toThrow();
      });
    });

    it('fuera de producción la guarda NO bloquea: en pruebas no es la barrera', () => {
      // Medición, no reproche. Importa para H5 porque define de qué depende
      // realmente el aislamiento en esta suite: de la barrera 2, no de ésta.
      expect(process.env.NODE_ENV).not.toBe('production');
      for (const [, url] of destinosProhibidos) {
        expect(() => assertOutboundUrlAllowed(url)).not.toThrow();
      }
      console.log(
        `[H5.S1.M2] NODE_ENV=${process.env.NODE_ENV ?? '—'} · la guarda anti-SSRF está inactiva ` +
          `fuera de producción: lo que impide la salida real es la configuración (barrera 2)`,
      );
    });

    it('la guarda clasifica las redes internas como bloqueadas, y una pública como no bloqueada', () => {
      // El sentido de la guarda es distinguir, no negar todo: si diera
      // `true` para cualquier cosa, el bloqueo de arriba no probaría nada.
      expect(isBlockedAddress('127.0.0.1')).toBe(true);
      expect(isBlockedAddress('10.0.0.5')).toBe(true);
      expect(isBlockedAddress('169.254.169.254')).toBe(true);
      expect(isBlockedAddress('8.8.8.8')).toBe(false);
    });
  });

  describe('barrera 2 · ningún destino configurado puede ser un tercero real', () => {
    it('los 26 destinos declarados usan dominios reservados que no resuelven', async () => {
      const { rows } = await sql.query<{ base_url: string }>(
        `select distinct base_url from integrations.external_providers
          where base_url is not null`,
      );

      const publicos = rows
        .map((r) => r.base_url)
        .filter(
          (url) =>
            !TLD_RESERVADOS.test(url) && !/127\.0\.0\.1|localhost/.test(url),
        );

      console.log(
        `[H5.S1.M2] destinos configurados=${rows.length} · con dominio alcanzable=${publicos.length}` +
          (publicos.length > 0 ? ` · ${publicos.join(', ')}` : ''),
      );

      // Si esto falla, alguien configuró un destino real y hay que mirarlo
      // antes de correr nada más: dejó de ser un entorno de pruebas.
      expect(publicos).toEqual([]);
      expect(rows.length).toBeGreaterThan(0);
    }, 60_000);

    it('la mensajería no tiene ninguna URL de proveedor cableada en su configuración', async () => {
      const { rows } = await sql.query<{ n: string }>(
        `select count(*)::text as n from messaging.provider_channel_configs
          where config_json::text ~ 'https?://'`,
      );

      console.log(
        `[H5.S1.M2] configuraciones de canal con URL: ${rows[0]?.n ?? '0'}`,
      );
      expect(Number(rows[0]?.n ?? '0')).toBe(0);
    }, 60_000);
  });

  describe('el intento real: se ejecuta y no llega', () => {
    it('resolver un destino configurado falla en el DNS: no hay socket a ningún tercero', async () => {
      const { rows } = await sql.query<{ base_url: string }>(
        `select base_url from integrations.external_providers
          where base_url is not null limit 1`,
      );
      const destino = rows[0]?.base_url;
      expect(destino).toBeDefined();

      // El intento de verdad, con la función real que usa el despachador.
      let bloqueo = '';
      try {
        await resolveOutboundDestination(destino as string);
        bloqueo = 'NO SE BLOQUEÓ';
      } catch (error: unknown) {
        bloqueo = error instanceof Error ? error.message : String(error);
      }

      console.log(`[H5.S1.M2] intento contra ${destino ?? '—'} → ${bloqueo}`);
      expect(bloqueo).not.toBe('NO SE BLOQUEÓ');
    }, 60_000);
  });
});
