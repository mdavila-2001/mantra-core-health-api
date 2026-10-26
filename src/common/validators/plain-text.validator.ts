import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Una etiqueta de marcado: `<b>`, `</p>`, `<script …>`, `<!-- … -->`, `<?xml`.
 *
 * Exige una letra, `/`, `!` o `?` justo después del `<` a propósito: un valor
 * clínico escribe `<140` o `PA < 140 y > 90` todo el tiempo, y eso no es HTML.
 */
const MARKUP_TAG = /<[/!?]?[a-z][^>]*>|<!--/iu;

/** Caracteres de control salvo tabulador y saltos de línea. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

/**
 * Acepta sólo texto plano: rechaza etiquetas de marcado y caracteres de control.
 *
 * El texto lo pintan después el expediente, el portal del paciente y el PDF
 * del encuentro; guardar marcado es dejar que alguno de ellos lo interprete.
 * No sanea: rechaza, para que lo guardado sea exactamente lo que se escribió.
 * Ignora lo que no es string (de eso se ocupa `@IsString`).
 */
export function IsPlainText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPlainText',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;
          return !MARKUP_TAG.test(value) && !CONTROL_CHARS.test(value);
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args?.property ?? propertyName} sólo admite texto plano (sin HTML ni caracteres de control)`;
        },
      },
    });
  };
}
