import { Module } from '@nestjs/common';
import { EnvModule } from './common/env.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeletionsModule } from './deletions/deletions.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { IdentityVerificationModule } from './identity-verification/identity-verification.module';
import { PharmacyErpModule } from './pharmacy-erp/pharmacy-erp.module';

/**
 * Emulador standalone de los proveedores externos que
 * mantra-core-health-redesa-api no conecta de verdad (mensajería, borrado
 * cross-store, embeddings, verificación de identidad y el sistema de gestión
 * de una farmacia externa).
 *
 * Deliberadamente sin nada del backend principal: ni base de datos, ni
 * multi-tenant, ni el esquema de auth interno. Es un doble de prueba con
 * forma de vendor real (API key + JSON + Swagger), pensado para levantarse
 * como proceso propio y que los workers le apunten por `.env`.
 */
@Module({
  imports: [
    EnvModule,
    HealthModule,
    NotificationsModule,
    DeletionsModule,
    EmbeddingsModule,
    IdentityVerificationModule,
    PharmacyErpModule,
  ],
})
export class AppModule {}
