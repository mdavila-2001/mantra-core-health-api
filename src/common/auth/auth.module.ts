import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { loadAuthEnv } from './auth.env';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { TokenService } from './token.service';

/**
 * Módulo transversal de autenticación/autorización.
 *
 * Registra los dos guards como `APP_GUARD` en orden: primero `JwtAuthGuard`
 * (autenticación), después `RolesGuard` (autorización). El orden importa -el
 * segundo asume que el primero ya pobló `request.user`- y Nest respeta el orden
 * de declaración de los proveedores `APP_GUARD`.
 *
 * `@Global` para que `TokenService` y las estrategias estén disponibles sin
 * reimportar el módulo en cada dominio.
 */
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: loadAuthEnv().secret,
      signOptions: { expiresIn: loadAuthEnv().accessTtl },
    } as JwtModuleOptions),
  ],
  providers: [
    JwtStrategy,
    TokenService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [TokenService, JwtModule],
})
export class AuthModule {}
