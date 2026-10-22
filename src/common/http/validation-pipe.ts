import {
  BadRequestException,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';
import { ErrorCode } from '../errors/error-codes';

/**
 * Un campo del cuerpo que no cumplió su DTO, con la ruta completa.
 *
 * Es la forma **estructurada** de la misma información que
 * `details.violations` da en frases. Existe porque las frases obligaban al
 * cliente a adivinar el campo con una expresión regular sobre el texto en
 * inglés de `class-validator`, y fallaba justo en los casos que más importan:
 * los objetos anidados (`items.0.quantity`) y las propiedades que el DTO no
 * declara (`forbidNonWhitelisted`), que es como se ve un contrato front ↔ API
 * desalineado.
 */
export interface FieldViolation {
  /** Ruta del campo en el cuerpo: `email`, `address.city`, `items.0.quantity`. */
  readonly field: string;
  /**
   * Nombres de las restricciones incumplidas (`isEmail`, `isNotEmpty`,
   * `whitelistValidation`…). Son estables y no llevan el valor recibido, así
   * que son lo que se registra en el log.
   */
  readonly constraints: readonly string[];
  /** Los mensajes de `class-validator`, para mostrar. */
  readonly messages: readonly string[];
}

/** Restricción que `forbidNonWhitelisted` usa para una propiedad no declarada. */
export const UNKNOWN_PROPERTY_CONSTRAINT = 'whitelistValidation';

/**
 * Aplana el árbol de `ValidationError` de `class-validator` a una lista de
 * campos con su ruta completa.
 *
 * Los índices de arreglo quedan como un segmento más (`items.0.quantity`),
 * igual que los escribe Nest en sus mensajes por defecto.
 */
export function flattenValidationErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): FieldViolation[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own: FieldViolation[] = error.constraints
      ? [
          {
            field,
            constraints: Object.keys(error.constraints),
            messages: Object.values(error.constraints),
          },
        ]
      : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/**
 * Las frases de `details.violations`, idénticas a las que Nest producía por
 * defecto: el mensaje de un campo anidado lleva delante la ruta del padre.
 * Se conservan porque el front y los int-specs ya las leen.
 */
function toViolationSentences(fields: readonly FieldViolation[]): string[] {
  return fields.flatMap(({ field, messages }) => {
    const parent = field.includes('.')
      ? field.slice(0, field.lastIndexOf('.'))
      : '';
    return messages.map((message) =>
      parent ? `${parent}.${message}` : message,
    );
  });
}

/**
 * Excepción del 400 de validación, con las dos formas del detalle.
 *
 * @param errors - Lo que entrega `class-validator`.
 */
export function validationFailed(
  errors: readonly ValidationError[],
): BadRequestException {
  const fields = flattenValidationErrors(errors);
  return new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Error de validación',
    details: {
      violations: toViolationSentences(fields),
      fields,
    },
  });
}

/**
 * El `ValidationPipe` global de la API.
 *
 * Una sola fábrica para `main.ts` y el harness de integración: si cada uno
 * construye el suyo, las pruebas validan un contrato distinto del que corre.
 *
 * - `whitelist` + `forbidNonWhitelisted` cierran el mass-assignment: una
 *   propiedad que el DTO no declara se rechaza en lugar de filtrarse al dominio.
 * - `transform` + `enableImplicitConversion` habilitan la coerción declarada
 *   con class-transformer (p. ej. query params numéricos).
 * - `exceptionFactory` agrega `details.fields`: la ruta de cada campo y el
 *   nombre de la restricción, que el front ancla al control del formulario y
 *   el filtro global deja escritos en el log.
 */
export function createGlobalValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => validationFailed(errors),
  });
}
