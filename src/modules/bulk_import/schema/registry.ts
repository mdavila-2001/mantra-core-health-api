import { CLINICAL_SCHEMAS } from './clinical-kinds';
import type { KindSchema } from './field-schema';
import { USER_SCHEMAS } from './user-kinds';

/** Todos los tipos de carga, en el orden en que salen en el catálogo. */
export const ALL_KIND_SCHEMAS: readonly KindSchema[] = [
  ...USER_SCHEMAS,
  ...CLINICAL_SCHEMAS,
];

const BY_KIND = new Map(
  ALL_KIND_SCHEMAS.map((schema) => [schema.kind, schema]),
);

/** El esquema de un tipo, o `undefined` si no existe. */
export function findKindSchema(kind: string): KindSchema | undefined {
  return BY_KIND.get(kind);
}
