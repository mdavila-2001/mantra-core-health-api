import { applyDecorators } from '@nestjs/common';
import { IsEmail, Matches } from 'class-validator';

/**
 * Strict email for self-registration. `@IsEmail()` alone accepts RFC local
 * parts such as `ana*{x}@gmail.com` or `---+++@gmail.com`; this narrows it to
 * ASCII letters and digits with single `.`, `_` or `-` only between them (no
 * leading, trailing or repeated symbols, no `+`), domain labels of letters and
 * digits with inner single hyphens, and a TLD of 2+ letters. Same rule as the
 * frontend's `CORREO_ESTRICTO`.
 */
export const STRICT_EMAIL_PATTERN =
  /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*@[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?:\.[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)*\.[A-Za-z]{2,}$/;

export const STRICT_EMAIL_MESSAGE =
  'El correo sólo admite letras y números, con . _ - sueltos entre ellos (sin espacios ni otros símbolos)';

export function IsStrictEmail(): PropertyDecorator {
  return applyDecorators(
    IsEmail(),
    Matches(STRICT_EMAIL_PATTERN, { message: STRICT_EMAIL_MESSAGE }),
  );
}
