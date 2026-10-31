import type { EntityManager } from '@mikro-orm/postgresql';
import type { IpRuleType } from '../../domain/network-rules';

/** Una regla de red de una organización, tal como la ve el límite de autenticación. */
export interface NetworkRuleRecord {
  /** Identificador de la regla. */
  readonly id: string;
  /** Organización dueña. */
  readonly tenantId: string;
  /** Permite o niega el rango. */
  readonly type: IpRuleType;
  /** Rango CIDR. */
  readonly cidr: string;
  /** Para qué existe, en palabras de quien la creó. */
  readonly description?: string;
  /** Desde cuándo rige. */
  readonly validFrom?: Date;
  /** Hasta cuándo rige. */
  readonly validTo?: Date;
}

/** Una regla nueva que reemplaza el conjunto de la organización. */
export interface NewNetworkRule {
  readonly type: IpRuleType;
  readonly cidr: string;
  readonly description?: string;
  readonly validFrom?: Date;
  readonly validTo?: Date;
}

/**
 * Reglas de red de las organizaciones (`authz.ip_access_rules`), acotadas al
 * límite de autenticación: se leen al abrir y refrescar una sesión del personal
 * y las define la organización. Solo reglas de TODA la organización
 * (`scope = SCOPE_TENANT`, sin sujeto); las que nombran a un sujeto no se evalúan.
 */
export interface IpAccessRulesPort {
  /** Reglas vigentes (activas y dentro de su vigencia) de varias organizaciones. */
  listEffective(
    em: EntityManager,
    tenantIds: readonly string[],
    now: Date,
  ): Promise<NetworkRuleRecord[]>;

  /** Reglas activas de una organización, vigentes o no, para administrarlas. */
  listActive(em: EntityManager, tenantId: string): Promise<NetworkRuleRecord[]>;

  /** Cuántas reglas de red activas hay en toda la plataforma (comprobación de arranque). */
  countActive(em: EntityManager): Promise<number>;

  /** Retira las reglas activas de la organización y deja las nuevas (sin flush). */
  replace(
    em: EntityManager,
    tenantId: string,
    rules: readonly NewNetworkRule[],
    actorUserId: string,
  ): Promise<void>;
}

export const IP_ACCESS_RULES_PORT = Symbol('IAM_IP_ACCESS_RULES_PORT');
