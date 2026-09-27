import { BadRequestException, HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Un campo incumplido del cuerpo, la query o los parámetros de la petición.
 *
 * Es la forma estructurada de `details.violations`: en lugar de un texto que
 * el cliente tiene que partir para adivinar el campo, trae la ruta completa y
 * cada regla incumplida por separado.
 */
export interface FieldViolation {
  /**
   * Ruta completa del campo, con notación de objeto y de arreglo:
   * `address.street`, `items[0].quantity`, `a.b[2].c`.
   */
  field: string;
  /**
   * Regla incumplida → mensaje, tal como los arma `class-validator`
   * (`{ isString: 'name must be a string' }`). La clave es estable y sirve
   * para ramificar; el mensaje es para humanos.
   */
  constraints: Record<string, string>;
  /** Los mensajes de `constraints`, en el mismo orden, sin la ruta delante. */
  messages: string[];
}

/** Forma de `details` en una respuesta `VALIDATION_FAILED` del `ValidationPipe`. */
export interface ValidationFailureDetails {
  /**
   * Un texto por regla incumplida, idéntico al que emite el `ValidationPipe`
   * de Nest por defecto (`items.0.name must be a string`). Se mantiene por
   * compatibilidad: el front lo lee en `error-to-view-state.ts`.
   */
  violations: string[];
  /** Lo mismo agrupado por campo y con la ruta completa. */
  fields: FieldViolation[];
}

/**
 * `exceptionFactory` del `ValidationPipe` global.
 *
 * Nest, por defecto, aplana los `ValidationError` a una lista de textos
 * (`message: string[]`) y el filtro global los publica como
 * `details.violations`. Eso pierde la estructura: en un objeto anidado o un
 * arreglo, el cliente tiene que desarmar `items.0.name must be a string` para
 * saber a qué control del formulario pintarle el error.
 *
 * Esta fábrica conserva `violations` **con el mismo texto que antes** y agrega
 * `fields`, una entrada por campo con la ruta completa (`items[0].name`), las
 * reglas incumplidas y sus mensajes. `message` sigue siendo el arreglo de
 * textos, así que `AllExceptionsFilter` responde el mismo `code` y `message`
 * que antes; `details` llega ya armado y el filtro lo respeta tal cual.
 *
 * @param errors - Errores que entrega `class-validator` al `ValidationPipe`.
 * @returns La excepción 400 que el filtro global traduce al envelope estable.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const fields: FieldViolation[] = [];
  const violations: string[] = [];
  for (const error of errors) {
    collect(error, [], undefined, fields, violations);
  }
  const details: ValidationFailureDetails = { violations, fields };
  return new BadRequestException({
    statusCode: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: violations,
    details,
  });
}

/**
 * Recorre un `ValidationError` y sus hijos en profundidad.
 *
 * @param error - Nodo actual.
 * @param parents - Propiedades de los ancestros, de la raíz al padre.
 * @param parentValue - Valor del padre, para decidir si `error.property` es un
 *   índice de arreglo. `class-validator` lo omite si se configura
 *   `validationError.value: false`; en ese caso se infiere por la forma.
 * @param fields - Acumulador de campos estructurados.
 * @param violations - Acumulador de textos planos compatibles con Nest.
 */
function collect(
  error: ValidationError,
  parents: readonly PathSegment[],
  parentValue: unknown,
  fields: FieldViolation[],
  violations: string[],
): void {
  const segment: PathSegment = {
    property: error.property,
    index: isArrayIndex(error.property, parentValue),
  };
  const path = [...parents, segment];

  const constraints = error.constraints ?? {};
  const messages = Object.values(constraints);
  if (messages.length > 0) {
    fields.push({ field: toFieldPath(path), constraints, messages });
    // Mismo texto que `ValidationPipe#prependConstraintsWithParentProp`: la
    // ruta de los ancestros con puntos (incluidos los índices) delante del
    // mensaje, que ya empieza por el nombre de la propiedad.
    const prefix = parents.map((p) => p.property).join('.');
    for (const message of messages) {
      violations.push(prefix ? `${prefix}.${message}` : message);
    }
  }

  for (const child of error.children ?? []) {
    collect(child, path, error.value, fields, violations);
  }
}

/** Un tramo de la ruta: el nombre de la propiedad y si es un índice. */
interface PathSegment {
  property: string;
  index: boolean;
}

/**
 * `class-validator` nombra los elementos de un arreglo validado con
 * `@ValidateNested({ each: true })` por su índice (`'0'`, `'1'`…).
 */
function isArrayIndex(property: string, parentValue: unknown): boolean {
  if (Array.isArray(parentValue)) return true;
  // Sin el valor del padre (opción `validationError.value: false`), un nombre
  // puramente numérico sólo puede venir de un arreglo en un DTO de esta API.
  return parentValue === undefined && /^\d+$/.test(property);
}

/** `[a, b, 0, c]` → `a.b[0].c`. */
function toFieldPath(path: readonly PathSegment[]): string {
  let out = '';
  for (const { property, index } of path) {
    if (index) out += `[${property}]`;
    else out += out ? `.${property}` : property;
  }
  return out;
}
