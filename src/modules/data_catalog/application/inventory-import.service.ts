import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { planImport, type ImportCounters } from '../domain/catalog/import-plan';
import { InventoryRepository } from '../infrastructure/repositories/inventory.repository';
import { CatalogInventoryRepository } from '../infrastructure/repositories/catalog-inventory.repository';

/** Lo que la importación informa: qué inventario leyó y qué hizo con él. */
export interface InventoryImportResult extends ImportCounters {
  inventory: { hash: string; operaciones: number; procesos: number };
}

/**
 * Importa el inventario generado (`inventario/**`) a las cinco tablas del mapa operaciones ↔ datos
 * de `data_catalog`, para poder cruzarlo con `catalog_objects`, las fichas y la sonda.
 *
 * Los archivos siguen siendo la fuente del detalle de cada operación (contrato, árbol, grafo,
 * glosario); la base guarda el índice consultable. La importación es **idempotente**: lo que no
 * cambió no se toca (ni sube `row_version`), y corre entera en una transacción, así que o queda
 * todo o no queda nada.
 *
 * Tiene que correr **después** de un escaneo: cada impacto apunta a un objeto de `catalog_objects`
 * y, si la sonda aún no lo observó, el impacto se salta y se cuenta (`skippedUnresolved`); la
 * siguiente corrida lo recupera sola.
 */
@Injectable()
export class InventoryImportService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogInventoryRepository,
    private readonly inventory: InventoryRepository,
  ) {}

  /**
   * Si el inventario no está en la instancia, lanza el 503 de {@link InventoryRepository}: no hay
   * nada que importar y quien llama debe verlo.
   */
  async importInventory(actorId: string): Promise<InventoryImportResult> {
    // se lee antes de abrir la transacción: un 503 no debe costar un candado ni una conexión
    const operaciones = this.inventory.operaciones();
    const procesos = this.inventory.procesos();
    const { hash } = this.inventory.version();

    return this.em.fork().transactional(async (tx) => {
      await this.repo.lock(tx);
      const plan = planImport(operaciones, procesos, await this.repo.known(tx));
      // el orden respeta las FK (sin CASCADE): operaciones antes que impactos y puentes, y los
      // puentes viejos fuera antes de reinsertar las etapas
      await this.repo.insertOperations(tx, plan.operationsToInsert, actorId);
      await this.repo.updateOperations(tx, plan.operationsToUpdate, actorId);
      await this.repo.retireOperations(tx, plan.operationsToRetire, actorId);
      await this.repo.deleteImpactsOf(tx, plan.impactsToDeleteOf);
      await this.repo.insertImpacts(tx, plan.impactsToInsert, actorId);
      await this.repo.insertProcesses(tx, plan.processesToInsert, actorId);
      await this.repo.updateProcesses(tx, plan.processesToUpdate, actorId);
      await this.repo.deleteStepsOf(tx, plan.processesToRebuildSteps);
      await this.repo.insertSteps(tx, plan.stepsToInsert, actorId);
      await this.repo.insertStepOperations(
        tx,
        plan.stepOperationsToInsert,
        actorId,
      );
      return {
        inventory: {
          hash,
          operaciones: operaciones.length,
          procesos: procesos.length,
        },
        ...plan.counters,
      };
    });
  }
}
