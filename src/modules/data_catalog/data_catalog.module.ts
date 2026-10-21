import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminPortalController } from './controllers/admin-portal.controller';
import * as entities from './entities';
import { InventoryRepository } from './inventory/inventory.repository';
import { PortalInventoryService } from './services/portal-inventory.service';

/**
 * Módulo 67 — catálogo de datos y portal administrativo de datos.
 *
 * Tiene dos mitades que no se mezclan:
 *   - `admin/portal/*`: lecturas del **inventario generado** (operaciones, flujos, catálogo
 *     estático, linaje, glosario). Sin base de datos; ver {@link InventoryRepository}.
 *   - `admin/catalog/*`: el catálogo **vivo**, sobre el esquema `data_catalog` del modelo
 *     (objetos observados por un escaneo de `pg_catalog`, fichas, revisiones, evidencia).
 *
 * Las entidades las genera `salud-db/gen_entities.py 67` del repo del modelo: el esquema
 * fluye modelo → entidades, nunca al revés.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AdminPortalController],
  providers: [InventoryRepository, PortalInventoryService],
  exports: [InventoryRepository],
})
export class DataCatalogModule {}
