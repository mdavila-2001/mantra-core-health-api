import { Injectable } from '@nestjs/common';

/**
 * Roles del módulo de infraestructura (CONTRATO-F2-F5 §0.3). Los de estructura
 * salen de la membresía (`StructureAccessService`); los operativos de
 * `delegated_access.organization_user_assignments`, con el alcance de la fila.
 */
export type InfraRole =
  | 'SUPERADMIN'
  | 'ORG_ADMIN'
  | 'BRANCH_ADMIN'
  | 'NURSE'
  | 'NURSE_SUPERVISOR'
  | 'ADMISSION'
  | 'HOUSEKEEPING'
  | 'HOUSEKEEPING_SUPERVISOR'
  | 'MAINTENANCE'
  | 'OR_MANAGER'
  | 'INFECTION_CONTROL'
  | 'BILLING';

/** Roles que se derivan de otro: el supervisor puede todo lo que el operario. */
export const IMPLIED_ROLES: Readonly<Partial<Record<InfraRole, InfraRole[]>>> =
  {
    NURSE_SUPERVISOR: ['NURSE'],
    HOUSEKEEPING_SUPERVISOR: ['HOUSEKEEPING'],
  };

/** Regla de una acción: qué roles la hacen y con qué límites. */
export interface InfraActionRule {
  /** Roles que pueden hacer la acción dentro de su alcance. */
  readonly roles: readonly InfraRole[];
  /**
   * Roles que sólo valen sobre espacios de ciertas funciones (el jefe de
   * quirófano sólo opera quirófanos). Código de la función, sin prefijo.
   */
  readonly onlyFunctions?: Readonly<
    Partial<Record<InfraRole, readonly string[]>>
  >;
  /**
   * Roles globales de plataforma o de tenant (`PERIOP_ADMIN`…) que también la
   * conceden y que no son un {@link InfraRole}. Los evalúa el evaluador propio de
   * la franja; este registro sólo los lista.
   */
  readonly globalRoles?: readonly string[];
  /** Resumen para personas (documentación de la política). */
  readonly summary: string;
}

/**
 * Política de una franja: el archivo `<modulo>/policies/infra-<franja>.policy.ts`
 * declara sus acciones y la registra en {@link InfraPolicyRegistry}. Así ninguna
 * franja edita la política de otra.
 */
export interface InfraPolicy {
  /** Nombre de la franja (`F2`, `F3`…). */
  readonly name: string;
  /** Acción → regla. Las acciones llevan el prefijo `infra.`. */
  readonly rules: Readonly<Record<string, InfraActionRule>>;
}

/**
 * Token del registro de políticas (CONTRATO-F2-F5 §0.3, «token multi-proveedor
 * `INFRA_POLICIES`»). Nest no tiene multi-proveedores como Angular: el token
 * resuelve a {@link InfraPolicyRegistry}, al que cada franja agrega su política en
 * `onModuleInit`, igual que `RETIRE_BLOCKER_PROVIDERS`.
 */
export const INFRA_POLICIES = 'PRACTICE_INFRA_POLICIES';

/** Registro de políticas de infraestructura. */
@Injectable()
export class InfraPolicyRegistry {
  private readonly policies = new Map<string, InfraPolicy>();

  /**
   * Agrega (o reemplaza, por nombre) una política.
   *
   * @param policy - La política de una franja.
   */
  register(policy: InfraPolicy): void {
    this.policies.set(policy.name, policy);
  }

  /**
   * Regla de una acción, de la primera política que la declara.
   *
   * @param action - Acción (`infra.block.clinical`…).
   * @returns La regla, o `undefined` si ninguna franja la declara.
   */
  rule(action: string): InfraActionRule | undefined {
    for (const policy of this.policies.values()) {
      const rule = policy.rules[action];
      if (rule) return rule;
    }
    return undefined;
  }

  /** Las políticas registradas, en orden de alta. */
  all(): InfraPolicy[] {
    return [...this.policies.values()];
  }
}
