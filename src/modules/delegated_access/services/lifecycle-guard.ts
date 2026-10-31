import type { EntityManager } from '@mikro-orm/postgresql';
import type { EngagementRecord } from '../repositories';

/** Lo que ve una guarda de autorización antes de que el servicio escriba nada. */
export interface LifecycleGuardContext {
  readonly tenantId: string;
  readonly em: EntityManager;
  /** El vínculo ya cargado; ausente en las operaciones sobre un caso. */
  readonly record?: EngagementRecord;
}

/**
 * Comprobación que aporta el llamador (el administrador delegado exige que toda
 * la persona esté dentro de su alcance) y que corre ANTES de cualquier
 * escritura. Lanza si no se puede continuar.
 */
export type LifecycleGuard = (ctx: LifecycleGuardContext) => Promise<void>;
