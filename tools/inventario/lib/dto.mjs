// Lectura de los DTO de la API: filas de campos con sus restricciones, ejemplos y
// payload mínimo. Une dos fuentes: el contrato OpenAPI (`components.schemas`) y las
// anotaciones del código (`class-validator` / `@ApiProperty`) del índice AST.
//
// Al crearse completa `contract.schemas` con los DTO que Swagger no registró porque
// ningún decorador de request/response los alcanza (ver `sourceClassSchema`).
import ts from 'typescript';
import { jsDoc, literal } from './ast.mjs';
import { code } from './markdown.mjs';
import { schemaName, schemaType } from './openapi.mjs';

/**
 * @param {object} options
 * @param {ReturnType<import('./openapi.mjs').loadContract>} options.contract
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} options.index
 * @param {boolean} [options.resolverAlias] - Si es true, un DTO publicado con
 *   `@ApiSchema({ name })` se busca por el nombre de su clase. El generador del
 *   markdown no lo activa para no cambiar la documentación ya publicada.
 */
export function createDtoReader({ contract, index, resolverAlias = false }) {
  const { schemas, dereference, mergedSchema } = contract;
  const {
    dtoConstraints,
    sourceClassProperties,
    sourceTypeAliases,
    sourceEnums,
  } = index;
  /** Propiedades declaradas de una clase, con las heredadas de su base. */
  function propiedadesDe(clave, profundidad = 0) {
    const propias = index.dtoConstraintsPorClave.get(clave) ?? new Map();
    const herencia = index.herenciaPorClave.get(clave);
    if (!herencia || profundidad > 5) return propias;
    // la base se busca primero en el mismo archivo y, si no, por nombre en todo src
    const mismaClave = `${herencia.relative}#${herencia.base}`;
    const claveBase = index.dtoConstraintsPorClave.has(mismaClave)
      ? mismaClave
      : [...index.dtoConstraintsPorClave.keys()].find((otra) =>
          otra.endsWith(`#${herencia.base}`),
        );
    if (!claveBase) return propias;
    const heredadas = new Map();
    for (const [nombre, valor] of propiedadesDe(claveBase, profundidad + 1)) {
      if (herencia.omitir?.includes(nombre)) continue;
      if (herencia.elegir && !herencia.elegir.includes(nombre)) continue;
      heredadas.set(nombre, valor);
    }
    return new Map([...heredadas, ...propias]);
  }

  /**
   * Propiedades declaradas del DTO que el contrato publica con ese nombre.
   * Con `modulo`, un nombre repetido entre módulos se resuelve por la clase que
   * vive en `src/modules/<modulo>/`; si aun así hay más de una, no se elige.
   */
  const dtoDe = (nombre, modulo) => {
    if (resolverAlias) {
      const clave = index.apiSchemaAliases.get(nombre);
      if (clave) return propiedadesDe(clave);
      const candidatas = [...index.dtoConstraintsPorClave.keys()].filter(
        (otra) => otra.endsWith(`#${nombre}`),
      );
      const delModulo = modulo
        ? candidatas.filter((otra) => otra.startsWith(`src/modules/${modulo}/`))
        : [];
      const elegidas = candidatas.length === 1 ? candidatas : delModulo;
      if (elegidas.length === 1) return propiedadesDe(elegidas[0]);
      // con nombres repetidos, el mapa por nombre guarda la última clase leída:
      // devolverlo sería atribuir los decoradores de otra clase
      return undefined;
    }
    return dtoConstraints.get(nombre);
  };

  function sourceTypeSchema(typeText, seen = new Set()) {
    let value = typeText.trim();
    const nullable = /\bnull\b/.test(value);
    value = value
      .split('|')
      .map((item) => item.trim())
      .filter((item) => item !== 'null' && item !== 'undefined')
      .join(' | ');

    const literalValues = value
      .match(/(?:^|\|)\s*['"]([^'"]+)['"]/g)
      ?.map((item) => item.replace(/^[|\s'"]+|['"\s]+$/g, ''));
    if (
      literalValues?.length &&
      literalValues.length === value.split('|').length
    ) {
      return { type: 'string', enum: literalValues, nullable };
    }
    if (value.startsWith('{')) {
      const parsed = ts.createSourceFile(
        '__inline_response.ts',
        `type __InlineResponse = ${value};`,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      const alias = parsed.statements.find(ts.isTypeAliasDeclaration);
      if (alias && ts.isTypeLiteralNode(alias.type)) {
        const objectSchema = {
          type: 'object',
          properties: {},
          required: [],
          nullable,
        };
        for (const member of alias.type.members) {
          if (!ts.isPropertySignature(member) || !member.name || !member.type)
            continue;
          const propertyName = member.name
            .getText(parsed)
            .replace(/^['"]|['"]$/g, '');
          const propertySchema = sourceTypeSchema(
            member.type.getText(parsed),
            seen,
          );
          const description = jsDoc(member);
          if (description) propertySchema.description = description;
          objectSchema.properties[propertyName] = propertySchema;
          if (!member.questionToken) objectSchema.required.push(propertyName);
        }
        if (!objectSchema.required.length) delete objectSchema.required;
        return objectSchema;
      }
    }
    const arrayMatch = value.match(/^(?:Array|ReadonlyArray)<([\s\S]+)>$/);
    if (arrayMatch)
      return {
        type: 'array',
        items: sourceTypeSchema(arrayMatch[1], seen),
        nullable,
      };
    if (value.endsWith('[]'))
      return {
        type: 'array',
        items: sourceTypeSchema(value.slice(0, -2), seen),
        nullable,
      };
    if (value === 'string') return { type: 'string', nullable };
    if (value === 'number') return { type: 'number', nullable };
    if (value === 'boolean') return { type: 'boolean', nullable };
    if (value === 'Date')
      return { type: 'string', format: 'date-time', nullable };
    if (
      value === 'unknown' ||
      value === 'any' ||
      value === 'object' ||
      value.startsWith('Record<')
    ) {
      return { type: 'object', additionalProperties: true, nullable };
    }
    if (sourceEnums.has(value))
      return { type: 'string', enum: sourceEnums.get(value), nullable };
    if (sourceTypeAliases.has(value) && !seen.has(value)) {
      return sourceTypeSchema(
        sourceTypeAliases.get(value),
        new Set([...seen, value]),
      );
    }
    if (sourceClassProperties.has(value) || schemas[value])
      return { $ref: `#/components/schemas/${value}` };
    return {
      type: 'object',
      description: `Tipo TypeScript no expandido: ${value}`,
      nullable,
    };
  }

  // Swagger solo registra modelos alcanzables desde decoradores de request/response.
  // Muchos controllers tipan su respuesta pero no usan @ApiOkResponse; se crea un
  // esquema documental secundario desde las propiedades reales de esas clases. Los
  // esquemas OpenAPI oficiales siempre tienen prioridad y nunca se sobrescriben.
  function sourceClassSchema(className, replacements = new Map()) {
    const properties = sourceClassProperties.get(className);
    if (!properties) return undefined;
    const generated = { type: 'object', properties: {}, required: [] };
    for (const [propertyName, metadata] of properties) {
      let typeText = metadata.typeText;
      for (const [parameter, replacement] of replacements) {
        typeText = typeText.replace(
          new RegExp(`\\b${parameter}\\b`, 'g'),
          replacement,
        );
      }
      const propertySchema = {
        ...sourceTypeSchema(typeText),
        ...metadata.constraints,
      };
      if (metadata.description)
        propertySchema.description = metadata.description;
      if (metadata.example !== undefined)
        propertySchema.example = literal(metadata.example);
      if (metadata.format) propertySchema.format = metadata.format;
      if (metadata.enumValues?.length)
        propertySchema.enum = metadata.enumValues;
      generated.properties[propertyName] = propertySchema;
      if (!metadata.optional) generated.required.push(propertyName);
    }
    if (!generated.required.length) delete generated.required;
    return generated;
  }

  for (const [className] of sourceClassProperties) {
    if (schemas[className]) continue;
    const generated = sourceClassSchema(className);
    schemas[className] = generated;
  }

  function runtimeConstraints(ownerName, propertyName) {
    return dtoDe(ownerName)?.get(propertyName)?.constraints ?? {};
  }

  function effectiveProperty(ownerName, propertyName, property) {
    return { ...runtimeConstraints(ownerName, propertyName), ...property };
  }

  function exampleString(name, schema) {
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.enum?.length) return schema.enum[0];
    const lower = name.toLowerCase();
    switch (schema.format) {
      case 'uuid':
        return '00000000-0000-4000-8000-000000000001';
      case 'email':
        return 'usuario@example.com';
      case 'date-time':
        return '2026-07-31T12:00:00.000Z';
      case 'date':
        return '2026-07-31';
      case 'time':
        return '12:00:00';
      case 'uri':
      case 'url':
        return 'https://example.com/recurso';
      case 'binary':
        return '<contenido-binario>';
    }
    if (lower.includes('timezone') || lower.includes('time_zone'))
      return 'America/La_Paz';
    if (lower.includes('currency')) return 'BOB';
    if (lower.includes('country')) return 'BO';
    if (lower.includes('language') || lower.includes('locale')) return 'es-BO';
    if (lower.includes('phone')) return '+59170000000';
    if (lower === 'status') return 'ok';
    if (lower.includes('sha256') || lower.includes('hash'))
      return 'a'.repeat(64);
    if (lower === 'email' || lower.endsWith('email'))
      return 'usuario@example.com';
    if (lower.endsWith('id') || lower.endsWith('_id'))
      return '00000000-0000-4000-8000-000000000001';
    if (lower.includes('code')) return 'CODIGO_EJEMPLO';
    if (lower.includes('name')) return 'Nombre de ejemplo';
    if (
      lower.includes('description') ||
      lower.includes('reason') ||
      lower.includes('notes')
    ) {
      return 'Texto descriptivo de ejemplo';
    }
    const min = Number.isFinite(schema.minLength) ? schema.minLength : 1;
    const max = Number.isFinite(schema.maxLength) ? schema.maxLength : 80;
    let value = lower.includes('password')
      ? 'ClaveSegura2026!'
      : 'valor-ejemplo';
    while (value.length < min) value += 'x';
    return value.slice(0, Math.max(1, max));
  }

  function exampleForSchema(
    input,
    mode = 'full',
    name = 'value',
    seen = new Set(),
    ownerName,
  ) {
    if (!input) return null;
    if (input.example !== undefined) return input.example;
    if (input.default !== undefined) return input.default;
    if (input.$ref) {
      const refName = schemaName(input);
      if (seen.has(refName)) return `<${refName}>`;
      return exampleForSchema(
        dereference(input),
        mode,
        name,
        new Set([...seen, refName]),
        refName,
      );
    }
    if (input.oneOf?.length)
      return exampleForSchema(input.oneOf[0], mode, name, seen, ownerName);
    if (input.anyOf?.length)
      return exampleForSchema(input.anyOf[0], mode, name, seen, ownerName);
    const schema = mergedSchema(input);
    if (schema.type === 'array') {
      const count = Math.max(1, schema.minItems ?? 1);
      return Array.from({ length: count }, () =>
        exampleForSchema(schema.items, mode, name, seen, ownerName),
      );
    }
    if (schema.type === 'object' || schema.properties) {
      const result = {};
      const required = new Set(schema.required ?? []);
      for (const [propertyName, rawProperty] of Object.entries(
        schema.properties ?? {},
      )) {
        if (mode === 'minimal' && !required.has(propertyName)) continue;
        const property = effectiveProperty(
          ownerName,
          propertyName,
          rawProperty,
        );
        result[propertyName] = exampleForSchema(
          property,
          mode,
          propertyName,
          seen,
          schemaName(rawProperty),
        );
      }
      if (!Object.keys(result).length && schema.additionalProperties)
        result.clave = 'valor';
      return result;
    }
    if (schema.type === 'integer') return Math.max(schema.minimum ?? 1, 1);
    if (schema.type === 'number') return Math.max(schema.minimum ?? 1, 1);
    if (schema.type === 'boolean') return schema.default ?? true;
    if (schema.type === 'string' || !schema.type)
      return exampleString(name, schema);
    return null;
  }

  /**
   * Restricciones de un campo como lista de frases. `formato` decide cómo se
   * escribe cada valor: `code` para el markdown, texto plano para el JSON.
   */
  function constraintParts(input, ownerName, propertyName, formato = code) {
    const schema = effectiveProperty(
      ownerName,
      propertyName,
      mergedSchema(input),
    );
    const parts = [];
    if (schema.format) parts.push(`formato ${formato(schema.format)}`);
    if (schema.enum?.length)
      parts.push(
        `valores: ${schema.enum.map((value) => formato(value)).join(', ')}`,
      );
    if (schema.minLength !== undefined)
      parts.push(`longitud mínima ${schema.minLength}`);
    if (schema.maxLength !== undefined)
      parts.push(`longitud máxima ${schema.maxLength}`);
    if (schema.minimum !== undefined) parts.push(`mínimo ${schema.minimum}`);
    if (schema.exclusiveMinimum !== undefined)
      parts.push(`mayor que ${schema.exclusiveMinimum}`);
    if (schema.maximum !== undefined) parts.push(`máximo ${schema.maximum}`);
    if (schema.minItems !== undefined)
      parts.push(`mínimo ${schema.minItems} elemento(s)`);
    if (schema.maxItems !== undefined)
      parts.push(`máximo ${schema.maxItems} elemento(s)`);
    if (schema.pattern) parts.push(`patrón ${formato(schema.pattern)}`);
    if (schema.runtimePattern)
      parts.push(`patrón runtime ${formato(schema.runtimePattern)}`);
    if (schema.uniqueItems) parts.push('elementos únicos');
    if (schema.readOnly) parts.push('solo lectura');
    if (schema.writeOnly) parts.push('solo escritura');
    if (schema.nullable) parts.push('admite null');
    return parts;
  }

  function constraintText(input, ownerName, propertyName) {
    return (
      constraintParts(input, ownerName, propertyName).join('; ') ||
      'Sin restricción adicional declarada'
    );
  }

  /**
   * Recorre un DTO y devuelve una entrada por campo (también los anidados), con
   * todo lo necesario para escribirla como texto (`fieldRows`) o como dato
   * (`camposDeDto`).
   */
  function fieldEntries(
    input,
    ownerName = schemaName(input),
    prefix = '',
    requiredByParent = true,
    seen = new Set(),
    depth = 0,
  ) {
    if (!input || depth > 6) return [];
    if (input.$ref) {
      const refName = schemaName(input);
      if (seen.has(refName)) return [];
      return fieldEntries(
        dereference(input),
        refName,
        prefix,
        requiredByParent,
        new Set([...seen, refName]),
        depth,
      );
    }
    const schema = mergedSchema(input);
    const entries = [];
    const required = new Set(schema.required ?? []);
    for (const [propertyName, rawProperty] of Object.entries(
      schema.properties ?? {},
    )) {
      const property = effectiveProperty(ownerName, propertyName, rawProperty);
      const field = prefix ? `${prefix}.${propertyName}` : propertyName;
      const isRequired = requiredByParent && required.has(propertyName);
      const example = exampleForSchema(
        property,
        'full',
        propertyName,
        seen,
        schemaName(rawProperty),
      );
      entries.push({
        field,
        ownerName,
        propertyName,
        isRequired,
        property,
        example,
      });
      const nested = property.type === 'array' ? property.items : property;
      entries.push(
        ...fieldEntries(
          nested,
          schemaName(nested),
          field + (property.type === 'array' ? '[]' : ''),
          isRequired,
          seen,
          depth + 1,
        ),
      );
    }
    return entries;
  }

  /** Filas de texto para las tablas del markdown. */
  function fieldRows(input) {
    return fieldEntries(input).map((entry) => ({
      field: entry.field,
      required: entry.isRequired ? 'Sí' : 'No',
      type: schemaType(entry.property),
      constraints: constraintText(
        entry.property,
        entry.ownerName,
        entry.propertyName,
      ),
      description:
        entry.property.description ||
        'Sin descripción específica en el contrato OpenAPI.',
      example:
        typeof entry.example === 'object'
          ? JSON.stringify(entry.example)
          : String(entry.example),
    }));
  }

  /**
   * Campos de un DTO como dato para el inventario. `decoradores` es lo escrito en
   * el código, literal; `restricciones` es lo que de eso se deriva en castellano.
   * Lo que no tiene fuente queda `null`, no se completa.
   */
  function camposDeDto(input, { modulo } = {}) {
    return fieldEntries(input).map((entry) => {
      const declarado = dtoDe(entry.ownerName, modulo)?.get(entry.propertyName);
      return {
        campo: entry.field,
        tipo: schemaType(entry.property),
        obligatorio: entry.isRequired,
        restricciones: constraintParts(
          entry.property,
          entry.ownerName,
          entry.propertyName,
          String,
        ),
        decoradores: (declarado?.decorators ?? [])
          .filter((decorator) => !decorator.name.startsWith('Api'))
          .map((decorator) => `@${decorator.text}`),
        descripcion: entry.property.description ?? null,
        ejemplo: entry.example,
        clase: entry.ownerName ?? null,
        fuente: declarado?.fuente ?? null,
      };
    });
  }

  /** Cuerpo con sólo los campos obligatorios, el mismo del markdown. */
  function payloadMinimo(input) {
    return exampleForSchema(input, 'minimal');
  }

  return {
    fieldRows,
    camposDeDto,
    payloadMinimo,
    exampleForSchema,
    constraintText,
    constraintParts,
    effectiveProperty,
    runtimeConstraints,
    sourceClassSchema,
    sourceTypeSchema,
  };
}
