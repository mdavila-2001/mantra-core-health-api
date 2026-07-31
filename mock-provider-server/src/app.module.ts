import { Module } from '@nestjs/common';
import { EnvModule } from './common/env.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeletionsModule } from './deletions/deletions.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { IdentityVerificationModule } from './identity-verification/identity-verification.module';

/**
 * Emulador standalone de los cuatro proveedores externos que
 * mantra-core-health-redesa-api todavía no conecta de verdad (mensajería,
 * borrado cross-store, embeddings y verificación de identidad) — ver `ESTADO-Y-PENDIENTES.md` del backend
 * principal, sección "Conectar proveedores externos reales a los workers".
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
  ],
})
export class AppModule {}
