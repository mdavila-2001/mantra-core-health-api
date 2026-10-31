import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ServiceCatalog } from '../billing/entities';
import { Practices } from '../practice/entities';
import { CatalogConcepts } from '../terminology/entities';
import { AdminServiceCatalogController } from './controllers/admin-service-catalog.controller';
import { AdminServiceCatalogService } from './services/admin-service-catalog.service';

/**
 * Editor de catálogos globales (`/admin/catalogs/*`). Hoy: Servicios.
 *
 * El glosario (`/admin/catalogs/glossary`) y el reporte contable por tipo de
 * usuario NO están en este módulo: ver
 * `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H3-catalogos.md`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([ServiceCatalog, Practices, CatalogConcepts]),
  ],
  controllers: [AdminServiceCatalogController],
  providers: [AdminServiceCatalogService],
})
export class AdminCatalogsModule {}
