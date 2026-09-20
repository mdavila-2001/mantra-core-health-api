import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { PinoLogger } from 'nestjs-pino';
import { MESSAGING_SEED } from '../../src/common/seed/messaging-seed.service';
import { MessagingAgendaNoticeAdapter } from '../../src/modules/scheduling/adapters/messaging-agenda-notice.adapter';
import type { SupportAdminNoticeAdapter } from '../../src/modules/scheduling/adapters/support-admin-notice.adapter';
import type { SchedulingNoticeRepository } from '../../src/modules/scheduling/repositories/scheduling-notice.repository';
import type { NotificationsService } from '../../src/modules/messaging/services';
import type {
  AgendaNotice,
  AgendaNoticeResult,
} from '../../src/modules/scheduling/ports/agenda-notice.port';
import {
  StrictAgendaNoticePortDouble,
  UnexpectedAgendaNoticeCall,
} from '../doubles/strict-agenda-notice-port.double';

/**
 * Relación `agenda → mensajería` ejercitada con **dobles fijados de los dos
 * extremos** (carril B, hito H2).
 *
 * ## Qué acredita y qué no
 *
 * Acredita que el adaptador real **traduce** lo que el puerto declara: cada
 * campo del aviso llega a la solicitud de mensajería con el origen que la ficha
 * fija, y cada modo de error se traduce como la ficha dice. El estado que esta
 * suite habilita es **`ADAPTER_VERIFIED_WITH_DOUBLES`, ni una palabra más
 * fuerte**.
 *
 * **No acredita** que ningún aviso llegue a ninguna parte: acá no hay base, no
 * hay fila de bandeja y no hay proveedor. Eso es H3, contra Postgres.
 *
 * ## Por qué vive en `test/` y no en `src/`
 *
 * Porque un doble compilado dentro de `dist/` es exactamente el riesgo que H5
 * existe para impedir. `nest build` compila `src/`; `test/` no entra.
 *
 * ## Por qué corre bajo `test:integration` sin necesitar Postgres
 *
 * `jest-integration.json` es el único config del repo cuyo `rootDir` alcanza
 * `test/`. Esta suite compone el adaptador a mano —sin `AppModule`, sin ORM—,
 * así que no abre conexión; la exigencia de base la traen las suites de H3/H4.
 */

/** Actor de servicio con el que el adaptador firma, según el código real. */
const CUALQUIER_UUID = (): string => randomUUID();

/** Un aviso de cancelación: el único `kind` que toca los tres canales. */
function avisoDeCancelacion(
  sobreescribir: Partial<AgendaNotice> = {},
): AgendaNotice {
  return {
    kind: 'BOOKING_STATE_CHANGED',
    recipient: { patientProfileId: CUALQUIER_UUID() },
    tenantId: CUALQUIER_UUID(),
    subject: 'Tu cita fue cancelada',
    bodyText:
      'El profesional canceló la cita del martes 10:00.\nMotivo: agenda reprogramada.',
    relatedResourceType: 'scheduling.bookings',
    relatedResourceId: CUALQUIER_UUID(),
    payload: { route: '/schedule?vista=citas' },
    debounceKey: `booking:${CUALQUIER_UUID()}`,
    ...sobreescribir,
  };
}

/** Lo que el doble de mensajería anotó de cada llamada. */
interface SolicitudCreada {
  readonly channelId: string;
  readonly recipientUserId?: string;
  readonly recipientAddress?: string;
  readonly tenantId?: string;
  readonly categoryConceptId?: string;
  readonly priority?: number;
  readonly debounceKey?: string;
  readonly relatedResourceType?: string;
  readonly relatedResourceId?: string;
  readonly payloadJson?: Record<string, unknown>;
  readonly actorId: string;
  /**
   * Las claves que el adaptador **realmente** puso en el DTO.
   *
   * Hace falta porque esta grabadora copia campo por campo, y copiar
   * `tenantId: dto.tenantId` crea la clave aunque valga `undefined`: preguntar
   * `'tenantId' in solicitud` mediría la grabadora, no al adaptador. El
   * adaptador omite con spread condicional, y eso sólo se ve acá.
   */
  readonly clavesDelDto: readonly string[];
}

/** Respuesta que el doble de mensajería va a dar a la próxima solicitud. */
interface RespuestaDeMensajeria {
  readonly id: string;
  readonly suppressed: boolean;
  readonly debounced: boolean;
  readonly suppressionReason?: string;
}

/**
 * El extremo **proveedor**, fijado: mensajería, el repositorio de avisos y el
 * adaptador de chat, cada uno devolviendo exactamente lo previsto.
 */
class ExtremoProveedorFijado {
  readonly solicitudes: SolicitudCreada[] = [];
  cuentaDelPerfil: string | null = CUALQUIER_UUID();
  correoDeLaCuenta: string | null = 'paciente@ejemplo.test';
  respuestaInApp: RespuestaDeMensajeria = {
    id: CUALQUIER_UUID(),
    suppressed: false,
    debounced: false,
  };
  respuestaCorreo: RespuestaDeMensajeria = {
    id: CUALQUIER_UUID(),
    suppressed: false,
    debounced: false,
  };
  entregaConBandeja = true;
  fallaLaCreacionInApp: Error | null = null;
  fallaElCorreo: Error | null = null;
  resultadoDelChat: { chatDelivered: boolean; chatSkippedReason?: string } = {
    chatDelivered: true,
  };

  get solicitudInApp(): SolicitudCreada | undefined {
    return this.solicitudes.find(
      (s) => s.channelId === MESSAGING_SEED.inAppChannelId,
    );
  }

  get solicitudDeCorreo(): SolicitudCreada | undefined {
    return this.solicitudes.find(
      (s) => s.channelId === MESSAGING_SEED.emailChannelId,
    );
  }

  /** Arma el adaptador real contra este extremo. */
  componer(): MessagingAgendaNoticeAdapter {
    const notifications = {
      createRequest: async (
        dto: Record<string, unknown>,
        actor: { id: string },
      ) => {
        const channelId = String(dto.channelId);
        this.solicitudes.push({
          channelId,
          recipientUserId: dto.recipientUserId as string | undefined,
          recipientAddress: dto.recipientAddress as string | undefined,
          tenantId: dto.tenantId as string | undefined,
          categoryConceptId: dto.categoryConceptId as string | undefined,
          priority: dto.priority as number | undefined,
          debounceKey: dto.debounceKey as string | undefined,
          relatedResourceType: dto.relatedResourceType as string | undefined,
          relatedResourceId: dto.relatedResourceId as string | undefined,
          payloadJson: dto.payloadJson as Record<string, unknown> | undefined,
          actorId: actor.id,
          clavesDelDto: Object.keys(dto),
        });
        const esCorreo = channelId === MESSAGING_SEED.emailChannelId;
        if (esCorreo && this.fallaElCorreo !== null) throw this.fallaElCorreo;
        if (!esCorreo && this.fallaLaCreacionInApp !== null) {
          throw this.fallaLaCreacionInApp;
        }
        const r = esCorreo ? this.respuestaCorreo : this.respuestaInApp;
        return {
          id: r.id,
          statusConceptId: CUALQUIER_UUID(),
          suppressed: r.suppressed,
          debounced: r.debounced,
          ...(r.suppressionReason === undefined
            ? {}
            : { suppressionReason: r.suppressionReason }),
        };
      },
      deliverNotification: async () => ({
        deliveryId: CUALQUIER_UUID(),
        attemptNumber: 1,
        deliveryStatusConceptId: CUALQUIER_UUID(),
        requestStatusConceptId: CUALQUIER_UUID(),
        ...(this.entregaConBandeja
          ? { inAppNotificationId: CUALQUIER_UUID() }
          : {}),
      }),
    } as unknown as NotificationsService;

    const noticeRepo = {
      findAccountForProfile: async () => this.cuentaDelPerfil,
      findEmailForUser: async () => this.correoDeLaCuenta,
    } as unknown as SchedulingNoticeRepository;

    const supportAdmin = {
      notify: async () => this.resultadoDelChat,
    } as unknown as SupportAdminNoticeAdapter;

    const em = { fork: () => em } as unknown as EntityManager;

    const logger = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    } as unknown as PinoLogger;

    return new MessagingAgendaNoticeAdapter(
      em,
      notifications,
      noticeRepo,
      supportAdmin,
      logger,
    );
  }
}

describe('Relación agenda → mensajería · dobles de ambos extremos (H2)', () => {
  describe('H2.S1.M2 · mapeo de datos: cada campo del contrato tiene origen y destino', () => {
    it('lleva kind, destinatario, tenant, recurso y rebote a la solicitud in-app', async () => {
      const proveedor = new ExtremoProveedorFijado();
      const cuenta = CUALQUIER_UUID();
      proveedor.cuentaDelPerfil = cuenta;
      const adaptador = proveedor.componer();
      const aviso = avisoDeCancelacion();

      const resultado = await adaptador.emit(aviso);

      const inApp = proveedor.solicitudInApp;
      expect(inApp).toBeDefined();
      expect(inApp?.recipientUserId).toBe(cuenta);
      expect(inApp?.tenantId).toBe(aviso.tenantId);
      expect(inApp?.relatedResourceType).toBe(aviso.relatedResourceType);
      expect(inApp?.relatedResourceId).toBe(aviso.relatedResourceId);
      expect(inApp?.debounceKey).toBe(aviso.debounceKey);
      expect(inApp?.payloadJson).toMatchObject({
        kind: 'BOOKING_STATE_CHANGED',
        subject: aviso.subject,
        bodyText: aviso.bodyText,
        route: '/schedule?vista=citas',
      });
      expect(resultado.delivered).toBe(true);
    });

    it('namespacea la clave de rebote del correo, porque el rebote no filtra por canal', async () => {
      const proveedor = new ExtremoProveedorFijado();
      const adaptador = proveedor.componer();
      const aviso = avisoDeCancelacion();

      await adaptador.emit(aviso);

      expect(proveedor.solicitudDeCorreo?.debounceKey).toBe(
        `${aviso.debounceKey}:email`,
      );
      expect(proveedor.solicitudInApp?.debounceKey).toBe(aviso.debounceKey);
    });

    it('firma con la cuenta de servicio cuando el aviso no trae actor', async () => {
      const proveedor = new ExtremoProveedorFijado();
      const adaptador = proveedor.componer();

      await adaptador.emit(avisoDeCancelacion());

      const actores = proveedor.solicitudes.map((s) => s.actorId);
      expect(new Set(actores).size).toBe(1);
      expect(actores[0]).toBeTruthy();
    });

    it('omite tenantId en vez de mandarlo nulo cuando el aviso no lo trae', async () => {
      const proveedor = new ExtremoProveedorFijado();
      const adaptador = proveedor.componer();
      const { tenantId: _omitido, ...sinTenant } = avisoDeCancelacion();

      await adaptador.emit(sinTenant as AgendaNotice);

      expect(proveedor.solicitudInApp).toBeDefined();
      expect(proveedor.solicitudInApp?.clavesDelDto).not.toContain('tenantId');
      expect(proveedor.solicitudInApp?.clavesDelDto).toContain(
        'recipientUserId',
      );
    });

    it('manda el correo con la dirección resuelta y el botón al destino navegable', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.correoDeLaCuenta = 'destino@ejemplo.test';
      const adaptador = proveedor.componer();

      await adaptador.emit(avisoDeCancelacion());

      const correo = proveedor.solicitudDeCorreo;
      expect(correo?.recipientAddress).toBe('destino@ejemplo.test');
      expect(String(correo?.payloadJson?.bodyHtml)).toContain(
        '/schedule?vista=citas',
      );
    });
  });

  describe('H2.S1.M3 · mapeo de errores: cada modo se traduce como dice la ficha', () => {
    it('sin cuenta de portal: delivered false, sin notificationRequestId', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.cuentaDelPerfil = null;
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r).toEqual<AgendaNoticeResult>({
        delivered: false,
        skippedReason: 'El destinatario no tiene cuenta de portal',
      });
      expect(proveedor.solicitudes).toHaveLength(0);
    });

    it('preferencia en contra: suprime el in-app pero igual intenta correo y chat', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.respuestaInApp = {
        id: CUALQUIER_UUID(),
        suppressed: true,
        debounced: false,
        suppressionReason: 'El destinatario silenció esta categoría',
      };
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(false);
      expect(r.skippedReason).toBe('El destinatario silenció esta categoría');
      expect(r.notificationRequestId).toBe(proveedor.respuestaInApp.id);
      expect(r.emailRequestId).toBe(proveedor.respuestaCorreo.id);
      expect(r.chatDelivered).toBe(true);
    });

    it('rebotada: intenta el correo pero NO el chat — el camino los trata distinto', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.respuestaInApp = {
        id: CUALQUIER_UUID(),
        suppressed: false,
        debounced: true,
      };
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(false);
      expect(r.skippedReason).toBe('Ya había un aviso igual sin entregar');
      expect(r.emailRequestId).toBe(proveedor.respuestaCorreo.id);
      expect(r.chatDelivered).toBeUndefined();
    });

    it('entrega sin fila de bandeja: delivered false con su motivo propio', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.entregaConBandeja = false;
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(false);
      expect(r.skippedReason).toBe('La entrega no produjo bandeja in-app');
      expect(r.inAppNotificationId).toBeUndefined();
    });

    it('excepción del in-app: NO lanza, y devuelve el motivo que el puerto promete', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.fallaLaCreacionInApp = new Error('mensajería caída');
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r).toEqual<AgendaNoticeResult>({
        delivered: false,
        skippedReason:
          'La emisión del aviso falló; la operación no se revierte',
      });
    });

    it('excepción del correo: no degrada delivered, informa aparte', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.fallaElCorreo = new Error('SMTP caído');
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(true);
      expect(r.emailSkippedReason).toBe('No se pudo encolar el correo');
      expect(r.emailRequestId).toBeUndefined();
    });

    it('cuenta sin correo declarado: lo dice, y el in-app sigue entregado', async () => {
      const proveedor = new ExtremoProveedorFijado();
      proveedor.correoDeLaCuenta = null;
      const adaptador = proveedor.componer();

      const r = await adaptador.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(true);
      expect(r.emailSkippedReason).toBe('La cuenta no declaró correo');
    });

    it('emitMany: un aviso que falla no cancela los demás', async () => {
      const proveedor = new ExtremoProveedorFijado();
      const adaptador = proveedor.componer();
      const bueno = avisoDeCancelacion();
      const malo = avisoDeCancelacion({ recipient: {} });

      const [r1, r2] = await adaptador.emitMany([malo, bueno]);

      expect(r1?.delivered).toBe(false);
      expect(r1?.skippedReason).toBe(
        'El destinatario no tiene cuenta de portal',
      );
      expect(r2?.delivered).toBe(true);
    });
  });

  describe('H5.S1 · el control estructural: ningún doble puede entrar a producción', () => {
    it('H5.S1.M1 · ningún archivo de src/ importa de test/', () => {
      const infractores: string[] = [];
      const recorrer = (dir: string): void => {
        for (const entrada of fs.readdirSync(dir)) {
          const ruta = path.join(dir, entrada);
          if (fs.statSync(ruta).isDirectory()) {
            recorrer(ruta);
            continue;
          }
          if (!ruta.endsWith('.ts')) continue;
          const texto = fs.readFileSync(ruta, 'utf8');
          // Cualquier import que salga de `src/` hacia `test/`.
          if (/from\s+['"][^'"]*\/test\//.test(texto)) {
            infractores.push(ruta);
          }
        }
      };
      recorrer(path.join(process.cwd(), 'src'));

      // Éste es el bloqueo *antes del envío*: si no hay camino de import, no
      // hay doble que bindear en la composición de producción. Es estructural
      // y comprobable, a diferencia de un `if (env !== 'prod')`.
      expect(infractores).toEqual([]);
    });

    it('H5.S1.M1-bis · el doble de esta relación vive fuera de lo que compila el build', () => {
      const tsconfigBuild = fs.readFileSync('tsconfig.build.json', 'utf8');

      // `nest build` compila con este tsconfig; si `test/` entrara, el doble
      // terminaría dentro de `dist/`.
      expect(tsconfigBuild).toMatch(/"exclude"/);
      expect(tsconfigBuild).toMatch(/test/);
    });
  });

  describe('H1.S1.M5 · el catálogo mínimo, contra el doble estricto del consumidor', () => {
    const doble = new StrictAgendaNoticePortDouble();

    afterEach(() => {
      doble.reset();
    });

    it('caso 1 · cambio propio válido: devuelve el resultado previsto y lo registra', async () => {
      doble.registrar({
        nombre: 'cancelación válida',
        cuando: (n) => n.kind === 'BOOKING_STATE_CHANGED',
        entonces: {
          delivered: true,
          inAppNotificationId: CUALQUIER_UUID(),
          notificationRequestId: CUALQUIER_UUID(),
          emailRequestId: CUALQUIER_UUID(),
          chatDelivered: true,
        },
      });

      const r = await doble.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(true);
      expect(doble.registradas).toHaveLength(1);
      expect(doble.registradas[0]?.secuencia).toBe(1);
      doble.assertClean();
    });

    it('caso 2 · proveedor indisponible: el motivo sale del catálogo de cinco', async () => {
      doble.registrar({
        nombre: 'proveedor caído',
        cuando: () => true,
        entonces: {
          delivered: false,
          skippedReason:
            'La emisión del aviso falló; la operación no se revierte',
        },
      });

      const r = await doble.emit(avisoDeCancelacion());

      expect(r.delivered).toBe(false);
      expect([
        'El destinatario no tiene cuenta de portal',
        'El destinatario no acepta este aviso por el canal in-app',
        'Ya había un aviso igual sin entregar',
        'La entrega no produjo bandeja in-app',
        'La emisión del aviso falló; la operación no se revierte',
      ]).toContain(r.skippedReason);
      doble.assertClean();
    });

    it('caso 4 · resultado incompatible: un campo que el puerto no tiene, falla', async () => {
      doble.registrar({
        nombre: 'resultado con campo inventado',
        cuando: () => true,
        entonces: {
          delivered: true,
          pushDelivered: true,
        } as unknown as AgendaNoticeResult,
      });

      await expect(doble.emit(avisoDeCancelacion())).rejects.toThrow(
        UnexpectedAgendaNoticeCall,
      );
      expect(() => doble.assertClean()).toThrow(/pushDelivered/);
    });

    it('caso 4-bis · chatDelivered en un kind que no manda chat, falla', async () => {
      doble.registrar({
        nombre: 'chat donde no va',
        cuando: () => true,
        entonces: { delivered: true, chatDelivered: true },
      });

      await expect(
        doble.emit(avisoDeCancelacion({ kind: 'APPOINTMENT_REMINDER' })),
      ).rejects.toThrow(UnexpectedAgendaNoticeCall);
      expect(() => doble.assertClean()).toThrow(/no manda por chat/);
    });

    it('caso 5 · KILL-TEST: la aplicación atrapa la excepción y el cierre falla igual', async () => {
      // Nada registrado: toda llamada es no prevista.
      const aplicacionQueAtrapa = async (): Promise<string> => {
        try {
          await doble.emit(avisoDeCancelacion());
          return 'emitido';
        } catch {
          // Exactamente lo que hacen los cuatro consumidores del puerto: un
          // aviso roto no puede tumbar la agenda.
          return 'atrapado y seguido';
        }
      };

      const salida = await aplicacionQueAtrapa();

      expect(salida).toBe('atrapado y seguido');
      expect(doble.fallosPendientes).toHaveLength(1);
      expect(() => doble.assertClean()).toThrow(
        /fallos del harness que la aplicación atrapó/,
      );
    });

    it('caso 5-bis · el doble JAMÁS convierte lo no previsto en {delivered:false}', async () => {
      let resultado: AgendaNoticeResult | null = null;
      try {
        resultado = await doble.emit(avisoDeCancelacion());
      } catch {
        resultado = null;
      }

      expect(resultado).toBeNull();
      expect(() => doble.assertClean()).toThrow();
    });

    it('caso 3 · destinatario mal formado (los dos a la vez) es rechazado', async () => {
      doble.registrar({
        nombre: 'cualquiera',
        cuando: () => true,
        entonces: { delivered: true },
      });

      await expect(
        doble.emit(
          avisoDeCancelacion({
            recipient: {
              patientProfileId: CUALQUIER_UUID(),
              userId: CUALQUIER_UUID(),
            },
          }),
        ),
      ).rejects.toThrow(/exactamente un destinatario/);
      expect(() => doble.assertClean()).toThrow();
    });

    it('caso 7 · reproducible: el reset deja el doble como nuevo entre casos', async () => {
      expect(doble.registradas).toHaveLength(0);
      doble.registrar({
        nombre: 'una sola vez',
        cuando: () => true,
        entonces: { delivered: true },
        veces: 1,
      });

      await doble.emit(avisoDeCancelacion());
      await expect(doble.emit(avisoDeCancelacion())).rejects.toThrow(
        UnexpectedAgendaNoticeCall,
      );
      expect(() => doble.assertClean()).toThrow();
    });
  });
});
