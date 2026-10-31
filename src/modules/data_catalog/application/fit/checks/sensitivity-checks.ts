import {
  classifyColumn,
  rankOf,
} from '../../../domain/classification/column-classifier';
import { SENSITIVITY_RANK } from '../../../domain/catalog/catalog.constants';
import type { FitInputs } from '../fit.types';
import { defineCheck, isTable, measure, noSource } from './check-helpers';

const UNKNOWN = 'UNKNOWN';
const sinClasificar = (nivel: string | null): boolean =>
  nivel === null || nivel === UNKNOWN;

export const tableSensitivityUnclassified = defineCheck({
  id: 'FIT-SEN-001',
  dimension: 'SENSITIVITY',
  title: 'Toda tabla observada tiene su sensibilidad clasificada',
  severity: 'MEDIA',
  remediation:
    'Clasificar la tabla en su ficha (`PUT /admin/catalog/objects/:id/annotation`, campo `sensitivity`); `UNKNOWN` significa «sin clasificar», no «sin datos sensibles».',
  evaluate(i: FitInputs) {
    const { liveObjects } = i;
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    return measure(
      liveObjects.value.filter((o) => isTable(o.kind)),
      (o) => o.card !== null && !sinClasificar(o.card.sensitivity),
      (o) => ({
        subject: `${o.schema}.${o.name}`,
        detail:
          o.card === null
            ? 'Sin ficha: sensibilidad desconocida'
            : 'Sensibilidad UNKNOWN',
      }),
    );
  },
});

export const columnSensitivityUnclassified = defineCheck({
  id: 'FIT-SEN-002',
  dimension: 'SENSITIVITY',
  title: 'Toda columna observada tiene su sensibilidad clasificada',
  severity: 'MEDIA',
  remediation:
    'Correr la clasificación automática (`POST /admin/catalog/classification/run`) y revisar a mano las columnas que quedan `NEEDS_REVIEW` o sin ficha.',
  evaluate(i: FitInputs) {
    const { liveObjects } = i;
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const columnas = liveObjects.value
      .filter((o) => isTable(o.kind))
      .flatMap((o) =>
        o.columns.map((c) => ({ tabla: `${o.schema}.${o.name}`, columna: c })),
      );
    return measure(
      columnas,
      (x) => !sinClasificar(x.columna.sensitivity),
      (x) => ({
        subject: `${x.tabla}.${x.columna.name}`,
        detail:
          x.columna.sensitivity === null
            ? 'Sin ficha de columna'
            : 'Sensibilidad UNKNOWN',
      }),
    );
  },
});

/** Primer nivel que el clasificador trata como dato de personas (no «interno» ni «público»). */
const PERSONAL_RANK = SENSITIVITY_RANK.PERSONAL;

export const piiCandidateUnderclassified = defineCheck({
  id: 'FIT-SEN-003',
  dimension: 'SENSITIVITY',
  title:
    'Ninguna columna que parece dato personal, clínico o credencial está sin clasificar o por debajo de lo detectado',
  severity: 'ALTA',
  remediation:
    'Subir la sensibilidad de la columna al nivel detectado (la clasificación automática nunca baja un nivel) y registrar quién lo decidió; si la regla se equivoca, corregir la regla, no la ficha.',
  evaluate(i: FitInputs) {
    const { liveObjects } = i;
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    const candidatas = liveObjects.value
      .filter((o) => isTable(o.kind))
      .flatMap((o) =>
        o.columns.flatMap((c) => {
          const propuesta = classifyColumn({
            columnName: c.name,
            nativeType: c.nativeType,
            objectName: o.name,
            schemaName: o.schema,
          });
          return propuesta && rankOf(propuesta.level) >= PERSONAL_RANK
            ? [{ tabla: `${o.schema}.${o.name}`, columna: c, propuesta }]
            : [];
        }),
      );
    return measure(
      candidatas,
      (x) =>
        !sinClasificar(x.columna.sensitivity) &&
        rankOf(x.columna.sensitivity as string) >= rankOf(x.propuesta.level),
      (x) => ({
        subject: `${x.tabla}.${x.columna.name}`,
        detail: `Detectada como ${x.propuesta.level} (regla ${x.propuesta.ruleId}); ficha: ${x.columna.sensitivity ?? 'sin ficha'}`,
      }),
    );
  },
});

export const SENSITIVITY_CHECKS = [
  tableSensitivityUnclassified,
  columnSensitivityUnclassified,
  piiCandidateUnderclassified,
];
