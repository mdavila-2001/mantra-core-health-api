import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { EntityRegistry } from '../../entities/entity_registry.entity';
import { tableKey } from '../mutability.types';

/**
 * Lee de `system_ops.entity_registry` qué tablas ya están registradas. Es una lectura de apoyo:
 * si la consulta falla, devuelve `null` y la pantalla dice «sin consultar» en vez de «no
 * registrada» (mostrar «No» por ausencia de dato es justo lo que se quiere evitar).
 */
@Injectable()
export class MutabilityRegistryReader {
  constructor(private readonly em: EntityManager) {}

  async registeredKeys(): Promise<Set<string> | null> {
    try {
      const rows = await this.em.find(
        EntityRegistry,
        {},
        { fields: ['schemaName', 'tableName'] as never },
      );
      return new Set(rows.map((r) => tableKey(r.schemaName, r.tableName)));
    } catch {
      return null;
    }
  }
}
