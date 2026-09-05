import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { QuotationInstallments, Quotations } from '../billing/entities';
import { ServiceCatalogRepository } from '../billing/repositories';
import { QuotationsController } from './controllers';
import {
  QuotationInstallmentsRepository,
  QuotationsRepository,
} from './repositories';
import { QuotationsService } from './services';

/**
 * Módulo Quotations (FT-24 — Creación de cotizaciones): arma presupuestos
 * sobre un servicio del catálogo de `billing` (FT-22), con un simulador de
 * financiamiento (FLAT/FRANCÉS) y las condiciones ofertadas congeladas.
 *
 * Las tablas (`billing.quotations`, `billing.quotation_installments`) viven en
 * el schema `billing`, pero el módulo se mantiene separado del dominio
 * `BillingModule` (decisión de FT-24). `ServiceCatalogRepository` se registra
 * acá como clase, sin importar `BillingModule`: el repositorio no guarda
 * estado —recibe el `EntityManager` en cada llamada—, así que una segunda
 * instancia es la misma cosa (mismo criterio que `PracticeModule`, ver
 * `src/modules/practice/practice.module.ts`).
 */
@Module({
  imports: [MikroOrmModule.forFeature([Quotations, QuotationInstallments])],
  controllers: [QuotationsController],
  providers: [
    // Repositorios
    QuotationsRepository,
    QuotationInstallmentsRepository,
    ServiceCatalogRepository,
    // Servicios
    QuotationsService,
  ],
})
export class QuotationsModule {}
