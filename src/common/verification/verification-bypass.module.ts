import { Global, Module } from '@nestjs/common';
import { VerificationBypassService } from './verification-bypass.service';

/**
 * Expone `VerificationBypassService` a cualquier módulo de dominio sin volver
 * a importar `VerificationBypassModule` en cada uno — mismo criterio que
 * `AuthModule`/`FileStorageModule`: es una pieza transversal, no de un dominio.
 */
@Global()
@Module({
  providers: [VerificationBypassService],
  exports: [VerificationBypassService],
})
export class VerificationBypassModule {}
