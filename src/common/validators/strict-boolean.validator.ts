import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, type ValidationOptions } from 'class-validator';

/**
 * Booleano estricto de un cuerpo JSON: sólo `true` o `false` pasan.
 *
 * El pipe global tiene `enableImplicitConversion`, y class-transformer convierte
 * un campo `boolean` con `Boolean(valor)`: `"false"`, `1`, `[]` o `{}` llegan
 * como `true`, y `0` o `""` como `false`. `@IsBoolean()` solo ve ya el valor
 * convertido y lo acepta. Este decorador vuelve a leer el valor **crudo** del
 * cuerpo (`obj[key]`, no `value`, que ya viene convertido) antes de validar,
 * así un texto o un número es un 400 y no una decisión tomada por el cliente.
 *
 * Es el único `IsBoolean` de los DTO de `pharmacy` y `pharmacy_inventory`: lo
 * exige `strict-boolean.rule.spec.ts`. Vive en `common` porque no es de ningún
 * contexto: lo usan los DTO de los dos módulos sin que uno entre al otro. No
 * toca `undefined` ni `null`: si el campo es opcional lo sigue decidiendo
 * `@IsOptional()` o `@ValidateIf()`.
 */
export function IsStrictBoolean(
  options?: ValidationOptions,
): PropertyDecorator {
  return applyDecorators(
    Transform(
      ({
        obj,
        key,
      }: {
        obj: Record<string, unknown> | undefined;
        key: string;
      }) => obj?.[key],
    ),
    IsBoolean(options),
  );
}
