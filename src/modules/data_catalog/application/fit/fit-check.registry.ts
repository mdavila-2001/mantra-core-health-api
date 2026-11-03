import { Injectable } from '@nestjs/common';
import { DEFAULT_FIT_CHECKS } from './checks';
import type { FitCheck } from './fit.types';

const ID_FORMAT = /^FIT-[A-Z]{3}-\d{3}$/;

/**
 * Registro de comprobaciones de la sonda de ajuste: el punto de extensión. Nace con las de fábrica
 * y otro módulo (p. ej. la taxonomía de mutabilidad) puede sumar las suyas con {@link register},
 * normalmente desde su `onModuleInit`. Un `id` es estable: registrar uno repetido es un error de
 * programación y falla al arrancar, no se pisa en silencio.
 */
@Injectable()
export class FitCheckRegistry {
  private readonly checks = new Map<string, FitCheck>();

  constructor() {
    for (const check of DEFAULT_FIT_CHECKS) this.register(check);
  }

  register(check: FitCheck): void {
    if (!ID_FORMAT.test(check.id))
      throw new Error(
        `Id de comprobación inválido: ${check.id} (forma FIT-XXX-000)`,
      );
    if (this.checks.has(check.id))
      throw new Error(`La comprobación ${check.id} ya está registrada`);
    this.checks.set(check.id, check);
  }

  all(): readonly FitCheck[] {
    return [...this.checks.values()];
  }
}
