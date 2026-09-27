import { createHmac } from 'node:crypto';
import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  parseTeleconsultIceEnv,
  type TeleconsultEnv,
  type TeleconsultIceConfig,
} from '../teleconsult.env';
import type { IceServersResponseDto } from '../dto';

/**
 * Token opcional para inyectar el entorno en pruebas. Sin él, se lee
 * `process.env`, que ya trae lo que `ConfigModule` cargó del `.env`.
 */
export const TELECONSULT_ENV = Symbol('TELECONSULT_ENV');

/**
 * Entrega la lista `iceServers` que el navegador pasa a `RTCPeerConnection`.
 *
 * **No hay servidor TURN contratado hoy.** Sin `TELECONSULT_TURN_*`, la API
 * entrega sólo STUN público y lo dice en el log de arranque: dos extremos
 * detrás de NAT simétrico (redes móviles, corporativas) no van a conectar
 * hasta que exista un TURN real. La credencial efímera sigue el esquema de
 * coturn `use-auth-secret` (usuario `<expira>:<userId>`, clave
 * `base64(HMAC-SHA1(secreto, usuario))`), así que el secreto nunca sale del
 * servidor.
 */
@Injectable()
export class TeleconsultIceService implements OnModuleInit {
  private readonly config: TeleconsultIceConfig;

  /**
   * @param logger - Logger estructurado.
   * @param env - Entorno a interpretar; por defecto `process.env`.
   * @throws Error si la configuración TURN es parcial: el proceso no arranca.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(TELECONSULT_ENV) env?: TeleconsultEnv,
  ) {
    this.logger.setContext(TeleconsultIceService.name);
    this.config = parseTeleconsultIceEnv(env ?? process.env);
  }

  /** Deja explícito en el arranque si hay TURN real o sólo STUN. */
  onModuleInit(): void {
    const turn = this.config.turn;
    if (!turn) {
      this.logger.warn(
        {
          operation: 'clinical_ext.teleconsult.ice.config',
          turnConfigured: false,
          stunCount: this.config.stunUrls.length,
        },
        'Teleconsulta: sin TURN configurado: solo STUN (doble/por defecto). ' +
          'Conexiones detrás de NAT simétrico pueden fallar.',
      );
      return;
    }
    this.logger.info(
      {
        operation: 'clinical_ext.teleconsult.ice.config',
        turnConfigured: true,
        turnMode: turn.mode,
        turnCount: turn.urls.length,
      },
      'Teleconsulta: TURN configurado por entorno',
    );
  }

  /** `true` si el entorno declaró un TURN completo. */
  get turnConfigured(): boolean {
    return this.config.turn !== undefined;
  }

  /**
   * Arma la lista de servidores ICE para un usuario.
   *
   * @param userId - Quién la pide; entra al usuario TURN efímero (es un id,
   *   no un dato clínico).
   * @param now - Reloj inyectable para pruebas.
   */
  iceServersFor(userId: string, now: Date = new Date()): IceServersResponseDto {
    const iceServers: IceServersResponseDto['iceServers'] = [
      { urls: [...this.config.stunUrls] },
    ];
    const turn = this.config.turn;
    let expiresAt: string | undefined;

    if (turn?.mode === 'static') {
      iceServers.push({
        urls: [...turn.urls],
        username: turn.username,
        credential: turn.credential,
      });
    } else if (turn?.mode === 'ephemeral') {
      const expiresEpoch = Math.floor(now.getTime() / 1000) + turn.ttlSeconds;
      const username = `${expiresEpoch}:${userId}`;
      const credential = createHmac('sha1', turn.secret)
        .update(username)
        .digest('base64');
      iceServers.push({ urls: [...turn.urls], username, credential });
      expiresAt = new Date(expiresEpoch * 1000).toISOString();
    }

    return {
      iceServers,
      turnConfigured: turn !== undefined,
      ...(expiresAt ? { expiresAt } : {}),
    };
  }
}
