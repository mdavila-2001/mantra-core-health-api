import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AssignmentsRepository } from './assignments.repository';
import { FORMS } from '../forms.concepts';

const TENANT = 'tenant-1';

/**
 * Asignaciones de prueba: activa global, activa propia, inactiva, ajena y de
 * otro target. Los tenants globales llevan `null` explícito, igual que la
 * columna.
 */
const FILAS = [
  {
    id: 'a-activa-global',
    stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
    tenantId: null,
    targetResourceConceptId: 'rt-1',
    fieldId: 'f-1',
    sectionId: 'sec-1',
    ordinal: 0,
  },
  {
    id: 'a-activa-propia',
    stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
    tenantId: TENANT,
    targetResourceConceptId: 'rt-1',
    fieldId: 'f-2',
    sectionId: 'sec-2',
    ordinal: 1,
  },
  {
    id: 'a-inactiva',
    stateConceptId: 'concepto-desactivado',
    tenantId: null,
    targetResourceConceptId: 'rt-1',
    fieldId: 'f-3',
    sectionId: 'sec-1',
    ordinal: 2,
  },
  {
    id: 'a-tenant-ajeno',
    stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
    tenantId: 'tenant-ajeno',
    targetResourceConceptId: 'rt-1',
    fieldId: 'f-4',
    sectionId: 'sec-1',
    ordinal: 3,
  },
  {
    id: 'a-otro-target',
    stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
    tenantId: null,
    targetResourceConceptId: 'rt-2',
    fieldId: 'f-1',
    sectionId: 'sec-1',
    ordinal: 4,
  },
];

/**
 * Evalúa el `where` que construye el repositorio sobre una fila: igualdad
 * plana y ramas `$or`. Suficiente para las formas que usa `findAssignments`.
 *
 * @param fila - Valor de fila requerido por la operación.
 * @param where - Valor de where requerido por la operación.
 * @returns true si la fila satisface la condición.
 */
function cumple(fila: any, where: any): boolean {
  return Object.entries(where).every(([clave, condicion]) => {
    if (clave === '$or') {
      return (condicion as any[]).some((rama) => cumple(fila, rama));
    }
    return fila[clave] === condicion;
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // El em simulado aplica de verdad el `where` sobre las filas de prueba, para
  // que el test demuestre el filtrado y no solo la forma de la consulta.
  const em = {
    find: mockFn((_entity: any, where: any, opts: any) => {
      const coincidentes = FILAS.filter((fila) => cumple(fila, where));
      return Promise.resolve(
        opts?.limit ? coincidentes.slice(0, opts.limit) : coincidentes,
      );
    }),
  };
  return { repo: new AssignmentsRepository(), em };
}

describe('AssignmentsRepository', () => {
  describe('findAssignments', () => {
    it('returns active assignments and excludes the inactive one', async () => {
      const d = build();
      const res = await d.repo.findAssignments(d.em as any, {}, TENANT, 50);
      const ids = res.map((fila: any) => fila.id);
      expect(ids).toContain('a-activa-global');
      expect(ids).toContain('a-activa-propia');
      expect(ids).not.toContain('a-inactiva');
    });

    it('excludes the assignment of another tenant', async () => {
      const d = build();
      const res = await d.repo.findAssignments(d.em as any, {}, TENANT, 50);
      expect(res.map((fila: any) => fila.id)).not.toContain('a-tenant-ajeno');
    });

    it('keeps narrowing by target, field and section', async () => {
      const d = build();

      const porTarget = await d.repo.findAssignments(
        d.em as any,
        { targetResourceConceptId: 'rt-2' },
        TENANT,
        50,
      );
      expect(porTarget.map((fila: any) => fila.id)).toEqual(['a-otro-target']);

      const porCampo = await d.repo.findAssignments(
        d.em as any,
        { fieldId: 'f-2' },
        TENANT,
        50,
      );
      expect(porCampo.map((fila: any) => fila.id)).toEqual(['a-activa-propia']);

      const porSeccion = await d.repo.findAssignments(
        d.em as any,
        { sectionId: 'sec-2' },
        TENANT,
        50,
      );
      expect(porSeccion.map((fila: any) => fila.id)).toEqual([
        'a-activa-propia',
      ]);
    });

    it('without a tenant in context it only serves the global ones', async () => {
      const d = build();
      const res = await d.repo.findAssignments(d.em as any, {}, undefined, 50);
      const ids = res.map((fila: any) => fila.id);
      expect(ids).toEqual(['a-activa-global', 'a-otro-target']);
    });
  });
});
