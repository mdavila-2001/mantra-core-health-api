import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { assessProxyConfig } from '../../domain/proxy-config';
import {
  IP_ACCESS_RULES_PORT,
  type IpAccessRulesPort,
} from '../ports/ip-access-rules.port';

/**
 * Al arrancar, comprueba que `TRUST_PROXY_HOPS` sea coherente con las reglas de
 * red activas (ver {@link assessProxyConfig}). Avisa en el log y, en
 * PRODUCCIÓN, con reglas de red activas y 0 saltos (o un valor inválido, que se
 * trata como 0) el arranque FALLA (SEG A-B8): detrás de un proxy todos los
 * clientes valen la IP del proxy y una regla `ALLOW` por una red ajena (o la
 * condición `network` de un permiso de apoyo) deja pasar o encierra a todos a la
 * vez. Quien despliega la API directamente expuesta, sin proxy, lo declara con
 * `TRUST_PROXY_HOPS_ALLOW_ZERO=true` y queda un aviso fuerte en el log. Fuera de
 * producción solo se registra como error: es configuración del despliegue y un
 * fallo de la propia comprobación (base sin migrar, sin conexión) nunca tumba la
 * API.
 */
@Injectable()
export class NetworkProxyCheckService implements OnApplicationBootstrap {
  /**
   * @param em - Contexto de persistencia.
   * @param port - Reglas de red de las organizaciones.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    @Inject(IP_ACCESS_RULES_PORT) private readonly port: IpAccessRulesPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NetworkProxyCheckService.name);
  }

  /** Corre la comprobación una vez, al terminar el arranque. */
  async onApplicationBootstrap(): Promise<void> {
    await this.check(process.env.TRUST_PROXY_HOPS);
  }

  /**
   * Comprueba y avisa.
   *
   * @param rawHops - Valor crudo de `TRUST_PROXY_HOPS`.
   * @param env - Entorno (por defecto `process.env`): `NODE_ENV` y `TRUST_PROXY_HOPS_ALLOW_ZERO`.
   * @returns Los códigos de los hallazgos avisados.
   * @throws Error en producción con reglas de red activas y 0 saltos sin `TRUST_PROXY_HOPS_ALLOW_ZERO=true`.
   */
  async check(
    rawHops: string | undefined,
    env: Readonly<Record<string, string | undefined>> = process.env,
  ): Promise<string[]> {
    let codes: string[] = [];
    let blocking: string | undefined;
    try {
      const active = await this.port.countActive(this.em.fork());
      const findings = assessProxyConfig(rawHops, active);
      for (const finding of findings) {
        this.logger.warn(
          { operation: 'iam.network.proxy-check', code: finding.code },
          finding.message,
        );
      }
      codes = findings.map((f) => f.code);
      // `INVALID` solo cuenta si hay reglas: la API lo trata como 0.
      const zero = findings.find(
        (f) =>
          f.code === 'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES' ||
          (f.code === 'TRUST_PROXY_HOPS_INVALID' && active > 0),
      );
      if (zero) {
        this.logger.error(
          { operation: 'iam.network.proxy-check', code: zero.code },
          `${zero.message}. Con reglas de red activas, TRUST_PROXY_HOPS debe ser el número real de proxies de confianza (≥ 1 detrás de un balanceador).`,
        );
        blocking = zero.message;
      }
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.network.proxy-check', err: error },
        'No se pudo comprobar TRUST_PROXY_HOPS contra las reglas de red',
      );
      return [];
    }
    if (
      blocking &&
      env.NODE_ENV === 'production' &&
      env.TRUST_PROXY_HOPS_ALLOW_ZERO !== 'true'
    ) {
      throw new Error(
        `Arranque detenido: TRUST_PROXY_HOPS inválido o 0 con reglas de red activas (${blocking}). Configure el número de proxies de confianza delante de la API o, si no hay ninguno, declare TRUST_PROXY_HOPS_ALLOW_ZERO=true.`,
      );
    }
    return codes;
  }
}
