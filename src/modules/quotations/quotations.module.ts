import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { QuotationInstallments, Quotations } from '../billing/entities';
import { ServiceCatalogRepository } from '../billing/repositories';
import { PracticeModule } from '../practice/practice.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { AppointmentsRepository } from '../clinical/repositories';
import { PatientProfilesRepository } from '../profiles/infrastructure/repositories';
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
 *
 * `PracticeModule` entra por `PracticeTenantLookupService`: el alcance de una
 * cotización lo decide la vinculación del actor con la práctica, no el rol —
 * es lo mismo que hace el `PATCH` del catálogo, y por lo mismo `BillingModule`
 * y `AccountingModule` ya lo importan. `practice` no importa `quotations`, así
 * que la dependencia va en un solo sentido y no cierra ciclo.
 *
 * `ClinicalModule` entra por `ClinicalReadService`: tener la práctica no
 * habilita a cualquier paciente, y la política que decide quién trata con un
 * paciente vive ahí (misma puerta que `MedicalGroupsModule`).
 * `PatientProfilesRepository` y `AppointmentsRepository` se registran como
 * clase —no guardan estado— por el mismo criterio que `ServiceCatalogRepository`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([Quotations, QuotationInstallments]),
    PracticeModule,
    ClinicalModule,
  ],
  controllers: [QuotationsController],
  providers: [
    // Repositorios
    QuotationsRepository,
    QuotationInstallmentsRepository,
    ServiceCatalogRepository,
    PatientProfilesRepository,
    AppointmentsRepository,
    // Servicios
    QuotationsService,
  ],
})
export class QuotationsModule {}
