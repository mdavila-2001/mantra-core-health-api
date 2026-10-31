import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  evaluateNetworkRules,
  isDeniedNowOrLater,
  isValidCidr,
  normalizeIp,
} from '../../domain/network-rules';
import type {
  EffectiveSessionRules,
  SessionPolicyViolation,
} from '../../domain/session-policy';
import type {
  IpAccessRulesResponseDto,
  PutIpAccessRulesDto,
} from '../../presentation/dto/ip-access-rules.dto';
import {
  IP_ACCESS_RULES_PORT,
  type IpAccessRulesPort,
  type NetworkRuleRecord,
} from '../ports/ip-access-rules.port';

/**
 * Reglas de red de la organización (`authz.ip_access_rules`): las define quien
 * administra la organización y las hace cumplir el login y el refresco del
 * personal cuando su política de sesión tiene `enforceIpRules`.
 *
 * El origen es el que entrega Express (`req.ip`), que solo mira `X-Forwarded-For`
 * hasta los saltos declarados en `TRUST_PROXY_HOPS`: una cabecera inventada por el
 * cliente no cambia el origen evaluado.
 */
@Injectable()
export class IpAccessRulesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param port - Reglas de red de las organizaciones.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    @Inject(IP_ACCESS_RULES_PORT) private readonly port: IpAccessRulesPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IpAccessRulesService.name);
  }

  /**
   * Organizaciones cuyas reglas de red niegan el origen. Cada organización se
   * evalúa con SUS reglas y solo si su política las exige: lo que una
   * organización niega no cierra a la persona en las demás.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param rules - Reglas de sesión efectivas de la persona.
   * @param ip - Origen de la petición (`req.ip`).
   * @returns Los ids de las organizaciones que niegan; vacío si ninguna.
   */
  async deniedTenantIds(
    em: EntityManager,
    rules: EffectiveSessionRules | undefined,
    ip: string | undefined,
  ): Promise<string[]> {
    const tenantIds = rules?.ipRuleTenantIds ?? [];
    if (tenantIds.length === 0) return [];
    const records = await this.port.listEffective(em, tenantIds, new Date());
    const origin = normalizeIp(ip);
    const denied: string[] = [];
    for (const tenantId of tenantIds) {
      const verdict = evaluateNetworkRules(
        origin,
        records.filter((r) => r.tenantId === tenantId),
      );
      if (verdict === 'DENIED') {
        this.logger.warn(
          { operation: 'iam.network.denied', tenantId },
          'Origin outside the allowed networks of the organization',
        );
        denied.push(tenantId);
      }
    }
    return denied;
  }

  /**
   * ¿Viola el origen las reglas de red de la organización indicada (o, sin
   * indicar, de alguna)? Con `tenantId` solo se mira esa organización: es la
   * pregunta «¿puede actuar desde aquí en X?».
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param rules - Reglas de sesión efectivas de la persona.
   * @param ip - Origen de la petición (`req.ip`).
   * @param tenantId - Organización a evaluar.
   * @returns `OUTSIDE_ALLOWED_NETWORK` si se niega; `null` si se permite.
   */
  async violationFor(
    em: EntityManager,
    rules: EffectiveSessionRules | undefined,
    ip: string | undefined,
    tenantId?: string,
  ): Promise<SessionPolicyViolation | null> {
    const scoped: EffectiveSessionRules | undefined =
      rules && tenantId
        ? {
            ...rules,
            ipRuleTenantIds: (rules.ipRuleTenantIds ?? []).filter(
              (id) => id === tenantId,
            ),
          }
        : rules;
    const denied = await this.deniedTenantIds(em, scoped, ip);
    return denied.length > 0 ? 'OUTSIDE_ALLOWED_NETWORK' : null;
  }

  /**
   * Lo que el servidor ve del origen de la petición: la IP contra la que se
   * evalúan las reglas de red. Sirve para mostrarla ANTES de guardar reglas.
   *
   * @param ip - Origen de la petición (`req.ip`).
   * @param trustProxyHops - Saltos de proxy de confianza configurados.
   * @returns La IP normalizada (o `null` si ilegible), su familia y los saltos.
   */
  describeOrigin(
    ip: string | undefined,
    trustProxyHops: number,
  ): {
    ip: string | null;
    family: 'ipv4' | 'ipv6' | null;
    trustProxyHops: number;
  } {
    const normalized = normalizeIp(ip);
    return {
      ip: normalized ?? null,
      family: normalized ? (normalized.includes(':') ? 'ipv6' : 'ipv4') : null,
      trustProxyHops,
    };
  }

  /**
   * Reglas activas de la organización activa.
   *
   * @returns Las reglas, en el orden en que se guardaron.
   */
  async list(): Promise<IpAccessRulesResponseDto> {
    const rows = await this.port.listActive(this.em.fork(), requireTenantId());
    return { rules: rows.map(toView) };
  }

  /**
   * Reemplaza las reglas de red de la organización activa. No se guarda un
   * conjunto que dejaría fuera el origen de quien lo guarda: nadie se encierra
   * afuera de su propia organización.
   *
   * @param dto - Reglas nuevas.
   * @param actor - Quien las define.
   * @param ip - Origen de quien las define.
   * @returns Las reglas activas tras el reemplazo.
   */
  async put(
    dto: PutIpAccessRulesDto,
    actor: AuthenticatedUser,
    ip: string | undefined,
  ): Promise<IpAccessRulesResponseDto> {
    const tenantId = requireTenantId();
    for (const rule of dto.rules) {
      if (!isValidCidr(rule.cidr)) {
        throw new PreconditionFailedException(
          'El rango de red no es un CIDR válido (ejemplo: 190.129.0.0/16)',
          { cidr: rule.cidr },
          IamErrorReason.IP_RULE_CIDR_INVALID,
        );
      }
      if (
        rule.validFrom &&
        rule.validTo &&
        new Date(rule.validTo) <= new Date(rule.validFrom)
      ) {
        throw new PreconditionFailedException(
          'La regla termina antes de empezar',
          { cidr: rule.cidr },
          IamErrorReason.IP_RULE_VALIDITY_INVALID,
        );
      }
    }
    // No se mira solo el conjunto vigente ahora: una regla con `validFrom`
    // futuro también cuenta, porque el día que entre en vigor encerraría a
    // quien no esté en ella.
    const scheduled = dto.rules.map((r) => ({
      type: r.type,
      cidr: r.cidr.trim(),
      validFrom: r.validFrom ? new Date(r.validFrom) : undefined,
      validTo: r.validTo ? new Date(r.validTo) : undefined,
    }));
    if (isDeniedNowOrLater(normalizeIp(ip), scheduled, new Date())) {
      throw new PreconditionFailedException(
        'Estas reglas dejarían fuera la red desde la que está trabajando',
        undefined,
        IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      );
    }
    await this.em.transactional(async (tx) => {
      await this.port.replace(
        tx,
        tenantId,
        dto.rules.map((r) => ({
          type: r.type,
          cidr: r.cidr.trim(),
          description: r.description,
          validFrom: r.validFrom ? new Date(r.validFrom) : undefined,
          validTo: r.validTo ? new Date(r.validTo) : undefined,
        })),
        actor.id,
      );
    });
    this.logger.info(
      {
        operation: 'iam.ip_access_rules.put',
        tenantId,
        count: dto.rules.length,
      },
      'Network rules replaced',
    );
    return this.list();
  }

  /**
   * Comprueba que las reglas de red YA guardadas (vigentes y futuras) no dejan
   * fuera el origen de quien guarda una política que las hace cumplir. Sin esto,
   * encender `enforceIpRules` sobre reglas ajenas al origen del actor lo
   * encerraría al terminar de guardar.
   *
   * @param em - Contexto de lectura.
   * @param tenantId - Organización.
   * @param ip - Origen de quien guarda la política.
   * @throws PreconditionFailedException `IP_RULES_WOULD_LOCK_OUT_ACTOR`.
   */
  async assertActorKeepsStoredRules(
    em: EntityManager,
    tenantId: string,
    ip: string | undefined,
  ): Promise<void> {
    const stored = await this.port.listActive(em, tenantId);
    if (isDeniedNowOrLater(normalizeIp(ip), stored, new Date())) {
      throw new PreconditionFailedException(
        'Las reglas de red de la organización dejarían fuera la red desde la que está trabajando',
        undefined,
        IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      );
    }
  }

  /**
   * Retira todas las reglas de red activas de una organización (ruta de rescate
   * de plataforma): quedan como histórico, no se borran.
   *
   * @param tenantId - Organización.
   * @param actorUserId - Quien ejecuta el rescate.
   * @returns Cuántas reglas había activas.
   */
  async clearForTenant(tenantId: string, actorUserId: string): Promise<number> {
    const retired = await this.em.transactional(async (tx) => {
      const current = await this.port.listActive(tx, tenantId);
      await this.port.replace(tx, tenantId, [], actorUserId);
      return current.length;
    });
    this.logger.warn(
      { operation: 'iam.ip_access_rules.rescue', tenantId, retired },
      'Network rules retired by platform rescue',
    );
    return retired;
  }
}

/** Vista pública de una regla. */
function toView(
  r: NetworkRuleRecord,
): IpAccessRulesResponseDto['rules'][number] {
  return {
    id: r.id,
    type: r.type,
    cidr: r.cidr,
    description: r.description,
    validFrom: r.validFrom?.toISOString(),
    validTo: r.validTo?.toISOString(),
  };
}
