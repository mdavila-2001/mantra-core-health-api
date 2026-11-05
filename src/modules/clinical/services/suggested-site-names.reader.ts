import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSites } from '../../practice/entities';

/**
 * Nombre de las sedes sugeridas en las órdenes.
 *
 * El paciente ve el nombre de la sede y nunca su uuid, así que quien arma la
 * respuesta de una orden (o de una página del portal) lo resuelve acá, en una
 * sola consulta por lote y no una por orden.
 */
@Injectable()
export class SuggestedSiteNamesReader {
  /**
   * Nombre de cada sede pedida.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param siteIds - Sedes sugeridas; las repetidas se leen una vez.
   * @returns Sede → nombre. Una sede inexistente no figura.
   */
  async namesFor(
    em: EntityManager,
    siteIds: readonly (string | null | undefined)[],
  ): Promise<Map<string, string>> {
    const unique = [
      ...new Set(
        siteIds.filter((id): id is string => id !== null && id !== undefined),
      ),
    ];
    if (unique.length === 0) return new Map();
    const sites = await em.find(
      PracticeSites,
      { id: { $in: unique } },
      { fields: ['id', 'name'] },
    );
    return new Map(sites.map((site) => [site.id, site.name] as const));
  }
}
