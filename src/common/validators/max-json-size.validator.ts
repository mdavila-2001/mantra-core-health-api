import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Acota el tamaño serializado de un campo de JSON libre (`Record<string, unknown>`).
 * No restringe la forma —payloads de esquema abierto (FHIR, documentos) la necesitan—
 * pero cierra el vector de abuso de un objeto arbitrariamente grande dentro del
 * límite de body HTTP.
 */
export function MaxJsonSize(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === undefined || value === null) return true;
          const [limit] = args.constraints as [number];
          try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= limit;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [limit] = args.constraints as [number];
          return `${args.property} excede el tamaño máximo permitido de ${limit} bytes`;
        },
      },
    });
  };
}
