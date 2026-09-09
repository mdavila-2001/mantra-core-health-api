import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../redis_runtime/redis.provider';
import type { ProfilePresenceDto } from '../dto';

/**
 * Cuánto dura «en línea» sin que el cliente renueve. El gateway renueva con
 * cada `presence:ping` (el cliente lo manda cada 25 s), así que un socket
 * vivo nunca expira y uno que murió sin `disconnect` —la pestaña que se
 * cerró de golpe, el móvil sin red— deja de figurar en línea en un minuto.
 */
export const PRESENCE_TTL_SEC = 60;

/** Cuánto se recuerda la última conexión. Después, «nunca» es la verdad útil. */
const LAST_SEEN_TTL_SEC = 30 * 24 * 60 * 60;

/**
 * Presencia de la mensajería: quién tiene el chat abierto ahora y cuándo se
 * lo vio por última vez (F4.2 del plan del chat).
 *
 * ## Por qué Redis y no una tabla
 *
 * «En línea» es un dato que caduca solo: la única forma honesta de decirlo
 * es una clave con TTL que el cliente renueva mientras vive. Una columna
 * `is_online` en `public_profiles` quedaría en `true` para siempre la primera
 * vez que alguien cierre la pestaña sin despedirse. `last_seen_at` sí
 * podría vivir en SQL, pero escribir una fila por cada conexión y
 * desconexión de cada perfil es tráfico de auditoría para un dato que sólo
 * se mira en la cabecera de un hilo.
 *
 * ## Sin tenant en la clave
 *
 * Los perfiles públicos son de la plataforma, no de un tenant (un paciente
 * le escribe a un médico de otra organización), así que no se pasa por
 * `RedisRuntimeService.keyFor`, que exige tenant. El prefijo `community:`
 * separa estas claves del resto.
 *
 * ## Nunca lanza hacia el gateway
 *
 * Un Redis caído no puede tirar un socket ni un `GET`: se degrada a «no se
 * sabe» (`online: false`, `lastSeenAt: null`) y se deja un `warn`.
 */
@Injectable()
export class CommunityPresenceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param redis - Cliente compartido del módulo `redis_runtime`.
   * @param logger - Logger estructurado.
   */
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityPresenceService.name);
  }

  /**
   * Marca (o renueva) a un perfil como en línea.
   *
   * @param profileId - Perfil que tiene la mensajería abierta.
   * @returns `true` si **no** estaba en línea antes (pasó de ausente a
   *   presente: hay que avisar); `false` si sólo se renovó.
   */
  async marcarEnLinea(profileId: string): Promise<boolean> {
    try {
      const ahora = new Date().toISOString();
      const [estaba] = await Promise.all([
        this.redis.set(
          this.clavePresencia(profileId),
          ahora,
          'EX',
          PRESENCE_TTL_SEC,
          'GET',
        ),
        this.redis.set(
          this.claveUltimaVez(profileId),
          ahora,
          'EX',
          LAST_SEEN_TTL_SEC,
        ),
      ]);
      return estaba === null;
    } catch (error) {
      this.logger.warn(
        { operation: 'community.presence.online', profileId, err: error },
        'No se pudo marcar la presencia; se sigue sin ella',
      );
      return false;
    }
  }

  /**
   * Marca a un perfil como desconectado y deja la hora.
   *
   * @param profileId - Perfil cuyo último socket se cerró.
   * @returns La hora que quedó como «última vez», o `null` si Redis no respondió.
   */
  async marcarDesconectado(profileId: string): Promise<Date | null> {
    try {
      const ahora = new Date();
      await Promise.all([
        this.redis.del(this.clavePresencia(profileId)),
        this.redis.set(
          this.claveUltimaVez(profileId),
          ahora.toISOString(),
          'EX',
          LAST_SEEN_TTL_SEC,
        ),
      ]);
      return ahora;
    } catch (error) {
      this.logger.warn(
        { operation: 'community.presence.offline', profileId, err: error },
        'No se pudo marcar la desconexión',
      );
      return null;
    }
  }

  /**
   * La presencia de varios perfiles de una vez (dos `MGET`, no una llamada
   * por perfil).
   *
   * @param profileIds - Perfiles a consultar.
   * @returns Una entrada por perfil, en el mismo orden.
   */
  async presenciaDe(profileIds: string[]): Promise<ProfilePresenceDto[]> {
    if (profileIds.length === 0) return [];
    try {
      const [enLinea, ultimaVez] = await Promise.all([
        this.redis.mget(profileIds.map((id) => this.clavePresencia(id))),
        this.redis.mget(profileIds.map((id) => this.claveUltimaVez(id))),
      ]);
      return profileIds.map((profileId, indice) => ({
        profileId,
        online: enLinea[indice] !== null && enLinea[indice] !== undefined,
        lastSeenAt: aFecha(ultimaVez[indice]),
      }));
    } catch (error) {
      this.logger.warn(
        { operation: 'community.presence.read', err: error },
        'No se pudo leer la presencia; se responde «no se sabe»',
      );
      return profileIds.map((profileId) => ({
        profileId,
        online: false,
        lastSeenAt: null,
      }));
    }
  }

  private clavePresencia(profileId: string): string {
    return `community:presence:${profileId}`;
  }

  private claveUltimaVez(profileId: string): string {
    return `community:lastseen:${profileId}`;
  }
}

function aFecha(valor: string | null | undefined): Date | null {
  if (valor === null || valor === undefined) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
