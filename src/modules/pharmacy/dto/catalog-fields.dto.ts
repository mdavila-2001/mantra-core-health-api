import { ValidateBy, type ValidationOptions } from 'class-validator';
import { normalizeMoney } from '../services/pharmacy-catalog-rules';

/** Estados del producto que acepta el portal de la farmacia (P47). */
export const CATALOG_STATUSES = ['PUBLISHED', 'DRAFT', 'WITHDRAWN'] as const;

/**
 * Un importe en bolivianos: número JSON o texto decimal, positivo, con hasta
 * 10 enteros y 2 decimales. `null` lo deja pasar (lo borra quien lo admite):
 * el `@IsOptional()` de al lado decide si `null` vale.
 *
 * Se valida sobre la representación decimal, nunca con aritmética de coma
 * flotante (regla 91.1.1): `0.125` o `1e3` no pasan.
 */
export function IsCatalogMoney(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCatalogMoney',
      validator: {
        validate: (value: unknown) =>
          value === null || normalizeMoney(value) !== null,
        defaultMessage: () =>
          '$property debe ser un importe positivo con hasta 2 decimales',
      },
    },
    options,
  );
}
