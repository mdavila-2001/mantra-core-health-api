import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthTokenModule } from './auth-token.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { VerifiedIdentityGuard } from './verified-identity.guard';

/**
 * Módulo transversal de autenticación/autorización de la API HTTP.
 *
 * Registra los tres guards como `APP_GUARD` en orden: primero `JwtAuthGuard`
 * (autenticación), después `RolesGuard` (autorización por rol) y por último
 * `VerifiedIdentityGuard` (identidad probada). El orden importa -cada uno asume
 * que el anterior ya pobló `request.user` o dejó pasar- y Nest respeta el orden
 * de declaración de los proveedores `APP_GUARD`. Los dos últimos no imponen
 * nada si el handler no declara su decorador.
 *
 * Sólo para procesos con servidor HTTP real (la API). Los workers usan
 * `AuthTokenModule` directamente — ver el porqué ahí.
 *
 * `@Global` para que `TokenService` y las estrategias estén disponibles sin
 * reimportar el módulo en cada dominio.
 *
 * `exports` re-exporta el módulo `AuthTokenModule` completo, no `TokenService`
 * suelto: Nest no permite exportar un provider que no está en los `providers`
 * propios de este módulo (vive en `AuthTokenModule`), sólo re-exportar el
 * módulo que lo declara.
 */
@Global()
@Module({
  imports: [PassportModule, AuthTokenModule],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: VerifiedIdentityGuard },
  ],
  exports: [AuthTokenModule],
})
export class AuthModule {}
