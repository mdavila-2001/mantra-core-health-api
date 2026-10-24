// Los cuerpos de request del contrato OpenAPI, tal como los valida la API.
//
// La API valida con `ValidationPipe({ whitelist, forbidNonWhitelisted })`
// (`src/common/http/validation-pipe.ts`): una clave que el DTO no declara es un
// 400. `@nestjs/swagger` no lo dice en el documento, y además tiene dos
// defectos que hacen que el contrato publicado mienta sobre qué acepta una
// escritura:
//
// 1. **Nombra cada esquema por el nombre de la clase.** Con dos DTO homónimos
//    en módulos distintos (`forms` y `surveys` tienen cada uno su
//    `CreateAssignmentDto`) queda uno solo en `components.schemas` y la otra
//    ruta se documenta con el cuerpo ajeno — Swagger apenas avisa
//    «Duplicate DTO detected» por consola. Así `POST /surveys/assignments`
//    figuraba con `fieldId`/`targetResourceConceptId` de formularios.
// 2. **No emite `additionalProperties: false`.** Un cliente generado o una
//    maqueta que lea el contrato no puede saber que las claves de más se
//    rechazan.
//
// Este módulo corrige las dos cosas desde los metadatos reales —las rutas y
// `@Body()` de Nest, los decoradores de `class-validator`—, no desde una lista
// escrita a mano. Sin dependencias de la app: recibe lo que necesita, para
// poder probarse con una app mínima (`request-body-contract.test.mjs`).

import {
  ROUTE_ARGS_METADATA,
  PARAMTYPES_METADATA,
} from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { getMetadataStorage, ValidationTypes } from 'class-validator';

// Las claves de metadatos de `@nestjs/swagger` (`dist/constants.js`). El
// paquete no exporta ese archivo (`exports` sólo publica `.` y `./plugin`),
// así que se repiten acá; las pruebas fallan si cambian, porque arman los DTO
// con los decoradores reales.
const DECORATORS = {
  API_MODEL_PROPERTIES: 'swagger/apiModelProperties',
  API_MODEL_PROPERTIES_ARRAY: 'swagger/apiModelPropertiesArray',
  API_SCHEMA: 'swagger/apiSchema',
};

const PRIMITIVES = new Set([String, Number, Boolean, Object, Array, Date]);

/** El prefijo de módulo para un nombre de esquema: `SurveysModule` → `Surveys`. */
function modulePrefix(moduleName) {
  return moduleName.replace(/Module$/, '');
}

/**
 * Los DTO de `@Body()` de cada controlador, con el módulo Nest que los declara.
 *
 * @param modules - `[{ name, controllers: [Clase] }]`, lo que expone
 *   `ModulesContainer` de la app arrancada.
 * @returns `Map<Clase, nombreDeMódulo>` sólo con clases propias (no `Object`).
 */
export function collectBodyClasses(modules) {
  const found = new Map();
  for (const { name, controllers } of modules) {
    for (const controller of controllers) {
      const proto = controller.prototype;
      for (const method of Object.getOwnPropertyNames(proto)) {
        if (method === 'constructor') continue;
        const args =
          Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, method) ?? {};
        const types =
          Reflect.getMetadata(PARAMTYPES_METADATA, proto, method) ?? [];
        for (const [key, arg] of Object.entries(args)) {
          if (Number(key.split(':')[0]) !== RouteParamtypes.BODY || arg.data)
            continue;
          const type = types[arg.index];
          if (
            typeof type === 'function' &&
            !PRIMITIVES.has(type) &&
            !found.has(type)
          ) {
            found.set(type, name);
          }
        }
      }
    }
  }
  return found;
}

/** La clase de una propiedad según `@ApiProperty({ type })`, si es un DTO. */
function propertyClass(proto, key) {
  const meta =
    Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, proto, key) ?? {};
  let type = meta.type;
  // `type: () => Clase` (perezoso) frente a `type: Clase`: una clase tiene prototipo propio.
  if (typeof type === 'function' && !type.prototype) type = type();
  if (Array.isArray(type)) type = type[0];
  return typeof type === 'function' && !PRIMITIVES.has(type) ? type : null;
}

function swaggerProperties(cls) {
  const list =
    Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, cls.prototype) ??
    [];
  return [...new Set(list.map((k) => k.replace(/^:/, '')))];
}

/**
 * Los DTO anidados que `class-validator` valida (`@ValidateNested`) dentro de
 * una clase: sólo esos heredan el `whitelist`. Un objeto anidado sin
 * `@ValidateNested` no se inspecciona y acepta cualquier clave.
 *
 * @returns `Map<propiedad, Clase>`.
 */
export function validatedNestedClasses(cls) {
  const nested = new Map();
  const metas = getMetadataStorage().getTargetValidationMetadatas(
    cls,
    '',
    true,
    false,
  );
  for (const meta of metas) {
    if (meta.type !== ValidationTypes.NESTED_VALIDATION) continue;
    const inner = propertyClass(cls.prototype, meta.propertyName);
    if (inner) nested.set(meta.propertyName, inner);
  }
  return nested;
}

/**
 * Da nombre propio a los DTO homónimos antes de generar el documento.
 *
 * Recorre los cuerpos y, transitivamente, sus DTO anidados. Si un nombre de
 * clase lo usan dos clases distintas, todas las que lo comparten pasan a
 * `<Módulo><Clase>` (`SurveysCreateAssignmentDto`) vía `@ApiSchema({ name })`
 * — el mismo metadato que pone el decorador, sobre la clase y no heredado.
 * Una clase que ya trae `@ApiSchema` con nombre se respeta.
 *
 * @param bodyClasses - Lo que devuelve {@link collectBodyClasses}.
 * @returns Los renombres hechos, `[{ from, to, module }]`.
 */
export function disambiguateHomonymSchemas(bodyClasses) {
  const owner = new Map(bodyClasses);
  const pending = [...bodyClasses.keys()];
  while (pending.length > 0) {
    const cls = pending.pop();
    for (const key of swaggerProperties(cls)) {
      const inner = propertyClass(cls.prototype, key);
      if (inner && !owner.has(inner)) {
        owner.set(inner, owner.get(cls));
        pending.push(inner);
      }
    }
  }

  const byName = new Map();
  for (const cls of owner.keys()) {
    const named = Reflect.getOwnMetadata(DECORATORS.API_SCHEMA, cls)?.at(
      -1,
    )?.name;
    if (named) continue;
    const list = byName.get(cls.name) ?? [];
    list.push(cls);
    byName.set(cls.name, list);
  }

  const renamed = [];
  const taken = new Set([...owner.keys()].map((c) => c.name));
  for (const [name, classes] of byName) {
    if (classes.length < 2) continue;
    for (const cls of classes) {
      const module = owner.get(cls);
      let candidate = `${modulePrefix(module)}${name}`;
      for (let i = 2; taken.has(candidate); i++)
        candidate = `${modulePrefix(module)}${name}${i}`;
      taken.add(candidate);
      const previous = Reflect.getOwnMetadata(DECORATORS.API_SCHEMA, cls) ?? [];
      Reflect.defineMetadata(
        DECORATORS.API_SCHEMA,
        [...previous, { name: candidate }],
        cls,
      );
      renamed.push({ from: name, to: candidate, module });
    }
  }
  return renamed.sort((a, b) => a.to.localeCompare(b.to));
}

/** El nombre de esquema con que Swagger documenta una clase. */
export function schemaNameOf(cls) {
  return (
    Reflect.getOwnMetadata(DECORATORS.API_SCHEMA, cls)?.at(-1)?.name ?? cls.name
  );
}

/**
 * Marca `additionalProperties: false` en cada esquema que la API valida con
 * `forbidNonWhitelisted`: el cuerpo de cada escritura y, dentro, los DTO que
 * `@ValidateNested` recorre.
 *
 * @returns Cuántos esquemas se cerraron.
 */
export function closeRequestBodies(document, bodyClasses) {
  const schemas = document.components?.schemas ?? {};
  const closed = new Set();
  const visit = (cls) => {
    const name = schemaNameOf(cls);
    if (closed.has(name) || !schemas[name]) return;
    closed.add(name);
    schemas[name].additionalProperties = false;
    for (const inner of validatedNestedClasses(cls).values()) visit(inner);
  };
  for (const cls of bodyClasses.keys()) visit(cls);
  return closed.size;
}

/**
 * Los módulos y controladores de una app Nest arrancada, en la forma que
 * esperan las funciones de arriba.
 */
export function modulesOf(modulesContainer) {
  return [...modulesContainer.values()].map((ref) => ({
    name: ref.metatype?.name ?? ref.name,
    controllers: [...ref.controllers.values()]
      .map((wrapper) => wrapper.metatype)
      .filter(Boolean),
  }));
}
