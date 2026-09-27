import { Module } from '@nestjs/common';
import { PublicCatalogController } from './controllers/public-catalog.controller';
import { PublicCatalogRepository } from './repositories/public-catalog.repository';
import { PublicCatalogService } from './services/public-catalog.service';

/**
 * Lecturas públicas de las fichas de organización y farmacia (M4 · H2).
 *
 * Módulo propio y no dentro de `community`, `billing` o `pharmacy`: cruza los
 * tres (el slug vive en `community`, los servicios en `billing`, los productos
 * en `pharmacy`) y ninguno es dueño de la vitrina. Sólo lee, con SQL crudo, sin
 * entidades propias.
 */
@Module({
  // Vacío pero declarado: `app.module.wiring.spec.ts` reconoce un módulo por la
  // metadata `imports`, que `@Module` sólo define si la clave está presente.
  // Sin esta línea, olvidar registrarlo en `AppModule` pasaba sin aviso.
  imports: [],
  controllers: [PublicCatalogController],
  providers: [PublicCatalogService, PublicCatalogRepository],
})
export class PublicCatalogModule {}
