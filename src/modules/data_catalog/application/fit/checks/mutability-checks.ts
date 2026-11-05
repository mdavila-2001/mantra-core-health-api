import type { FitInputs } from '../fit.types';
import { MUTABILITY_CLASSES } from '../fit.types';
import { defineCheck, isTable, measure, noSource } from './check-helpers';

export const mutabilityDeclared = defineCheck({
  id: 'FIT-MUT-001',
  dimension: 'MUTABILITY',
  title:
    'Toda tabla declara su clasificación de mutabilidad (append-only, actualizable, soft-delete, purga, legal-hold)',
  severity: 'MEDIA',
  remediation:
    'Declarar la clase de la tabla en el gobierno de mutabilidad (`system_ops/mutability`: estereotipo o evidencia en el modelo, regenerar `mutability.catalog.json`). Una tabla con `writeMode = UNKNOWN` cuenta como sin declarar.',
  evaluate(i: FitInputs) {
    const { mutability, liveObjects, staticTables } = i;
    if (!mutability.ok) return noSource('taxonomía de mutabilidad', mutability);
    if (mutability.value === null)
      return {
        kind: 'undeclared',
        reason:
          'No hay una fuente de mutabilidad registrada (FIT_MUTABILITY_SOURCE), así que no se mide ni se inventa un cero.',
      };
    const declaradas = mutability.value;
    const tablas = liveObjects.ok
      ? liveObjects.value
          .filter((o) => isTable(o.kind))
          .map((o) => `${o.schema}.${o.name}`)
      : staticTables.ok
        ? staticTables.value.map((t) => `${t.schema}.${t.table}`)
        : null;
    if (!tablas)
      return noSource('tablas', {
        reason: 'ni el catálogo vivo ni el estático están disponibles',
      });
    const validas: readonly string[] = MUTABILITY_CLASSES;
    return measure(
      tablas,
      (t) => validas.includes(declaradas.get(t) ?? ''),
      (t) => ({
        subject: t,
        detail: declaradas.has(t)
          ? `Clase «${declaradas.get(t)}» fuera de la taxonomía (${MUTABILITY_CLASSES.join(', ')})`
          : 'Sin clasificación de mutabilidad declarada',
      }),
    );
  },
});

export const MUTABILITY_CHECKS = [mutabilityDeclared];
