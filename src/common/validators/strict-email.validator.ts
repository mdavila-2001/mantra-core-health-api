import { applyDecorators } from '@nestjs/common';
import { IsEmail, Matches } from 'class-validator';

/**
 * Strict email for self-registration. `@IsEmail()` alone accepts RFC local
 * parts such as `ana*{x}@gmail.com`; this narrows it to ASCII letters, digits
 * and `. _ + -`, with no leading/trailing dot nor `..`, domain labels of
 * letters, digits and inner hyphens, and a TLD of 2+ letters. Same rule as
 * the frontend's `CORREO_ESTRICTO`.
 */
export const STRICT_EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9._+-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const STRICT_EMAIL_MESSAGE =
  'El correo sólo admite letras, números y . _ + - (sin espacios ni otros símbolos)';

export function IsStrictEmail(): PropertyDecorator {
  return applyDecorators(
    IsEmail(),
    Matches(STRICT_EMAIL_PATTERN, { message: STRICT_EMAIL_MESSAGE }),
  );
}
