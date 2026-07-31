import { Global, Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { loadAuthEnv } from './auth.env';
import { TokenService } from './token.service';

/**
 * Sólo la parte de `AuthModule` que hace falta para FIRMAR tokens
 * (`TokenService`/`JwtModule`), sin los tres `APP_GUARD` que registra aquel.
 *
 * Existe porque los 20 workers (`bootstrapWorker`) necesitan `TokenService`
 * para autofirmar su propio access token de rol `SYSTEM` como cliente HTTP
 * de la API — pero corren como `NestApplicationContext` (sin servidor HTTP,
 * sin requests, sin guards que puedan dispararse nunca). Aun así, `APP_GUARD`
 * se instancia igual durante el bootstrap del contenedor DI, y
 * `VerifiedIdentityGuard` requiere `EntityManager` (MikroORM), que los
 * workers no tienen conectado a propósito (nunca tocan la base directamente).
 * Importar el `AuthModule` completo hacía crashear el arranque de los 20
 * workers con "Nest can't resolve dependencies of VerifiedIdentityGuard".
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: loadAuthEnv().secret,
      signOptions: { expiresIn: loadAuthEnv().accessTtl },
    } as JwtModuleOptions),
  ],
  providers: [TokenService],
  exports: [TokenService, JwtModule],
})
export class AuthTokenModule {}
