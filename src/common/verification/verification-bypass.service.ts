import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  assertVerificationBypassNotInProduction,
  loadVerificationBypassEnv,
} from './verification-bypass.env';

/**
 * Único punto de lectura del bypass de verificación DEV/TEST.
 *
 * Nest resuelve todos los providers al construir `AppModule`
 * (`NestFactory.create`), así que el `throw` del constructor aborta
 * `bootstrap()` antes de que el servidor escuche — es la segunda mitad del
 * guardarraíl de `verificationBypassEnvSchema` (esa actúa en la validación de
 * `ConfigModule.forRoot`, esta actúa aunque algo construyera el módulo sin
 * pasar por ahí).
 *
 * `isActive()` es el único método que consumen los servicios de dominio: el
 * bypass no expone nada que permita escribir `verificationStatusConceptId`
 * ni ningún otro estado persistido, solo responde si el filtro de
 * verificación debe aplicarse.
 */
@Injectable()
export class VerificationBypassService {
  private readonly enabled: boolean;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(VerificationBypassService.name);
    assertVerificationBypassNotInProduction();
    this.enabled = loadVerificationBypassEnv().enabled;
    if (this.enabled) {
      this.logger.warn(
        { event: 'verification_bypass.active', nodeEnv: process.env.NODE_ENV },
        'DEV_VERIFICATION_BYPASS activo: la Guía de profesionales y la ' +
          'elegibilidad para citas no filtran por estado de verificación.',
      );
    }
  }

  /** Si el bypass está activo para este proceso. */
  isActive(): boolean {
    return this.enabled;
  }
}
