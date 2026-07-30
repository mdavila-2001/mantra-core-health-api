import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleEmailClient } from './google-email-client.service';

/**
 * `@Global()` para que cualquier `*WorkerModule` pueda inyectar
 * `GoogleEmailClient` sin reimportar este módulo — igual que
 * `MockProviderClientModule`/`SystemApiClientModule`. Sin `baseURL` propia:
 * el cliente llama dos hosts distintos de Google (`oauth2.googleapis.com` y
 * `gmail.googleapis.com`), así que cada llamada usa su URL completa.
 */
@Global()
@Module({
  imports: [HttpModule.register({ timeout: 30_000 })],
  providers: [GoogleEmailClient],
  exports: [GoogleEmailClient],
})
export class GoogleEmailClientModule {}
