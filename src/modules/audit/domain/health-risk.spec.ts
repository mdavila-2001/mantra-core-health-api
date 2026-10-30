import { deriveHealthRisk, type RiskInput } from './health-risk';

const mutacion = (extra: Partial<RiskInput>): RiskInput => ({
  kind: 'MUTATION',
  action: 'HTTP POST /demo',
  entity: 'demo',
  route: '/demo',
  method: 'POST',
  ...extra,
});

const acceso = (extra: Partial<RiskInput>): RiskInput => ({
  kind: 'DATA_ACCESS',
  action: '',
  entity: '',
  route: null,
  method: null,
  operation: 'READ',
  ...extra,
});

describe('deriveHealthRisk', () => {
  describe('CRITICAL', () => {
    it('un cambio de permisos por la ruta de authz', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'HTTP POST /authz/users/:userId/role-assignments',
            entity: 'users',
            route: '/authz/users/:userId/role-assignments',
          }),
        ),
      ).toBe('CRITICAL');
    });

    it('un cambio de permisos por la acción de negocio', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'ROLE_ASSIGNED',
            entity: 'user_role_assignment',
            route: null,
            method: null,
          }),
        ),
      ).toBe('CRITICAL');
    });

    it('una exportación de datos de salud', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'PATIENT_RECORDS_EXPORTED',
            entity: 'patient_export',
            route: null,
            method: null,
          }),
        ),
      ).toBe('CRITICAL');
      expect(
        deriveHealthRisk(acceso({ operation: 'EXPORT', hasPatient: true })),
      ).toBe('CRITICAL');
    });

    it('un acceso de emergencia (break-glass)', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'BREAK_GLASS_OPENED',
            entity: 'access',
            route: null,
            method: null,
          }),
        ),
      ).toBe('CRITICAL');
    });

    it('leer la lista de permisos no es cambiarlos', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'HTTP GET /authz/roles',
            route: '/authz/roles',
            method: 'GET',
          }),
        ),
      ).toBe('LOW');
    });
  });

  describe('HIGH y MEDIUM', () => {
    it('escribir datos clínicos es HIGH', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'MEDICATION_SIGNED',
            entity: 'medication_request',
            route: '/clinical/medication-requests/:id/sign',
          }),
        ),
      ).toBe('HIGH');
    });

    it('una mutación sin verbo derivable se trata como escritura', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'CONSENT_CAPTURED',
            entity: 'patient_consent',
            route: null,
            method: null,
          }),
        ),
      ).toBe('HIGH');
    });

    it('leer datos de un paciente es MEDIUM', () => {
      expect(deriveHealthRisk(acceso({ hasPatient: true }))).toBe('MEDIUM');
      expect(
        deriveHealthRisk(
          acceso({ entity: 'DIAGNOSTIC_REPORT', hasPatient: false }),
        ),
      ).toBe('MEDIUM');
      expect(
        deriveHealthRisk(
          acceso({ entity: 'PATIENT_PROFILE', hasPatient: false }),
        ),
      ).toBe('MEDIUM');
    });

    it('escribir en el registro de accesos de un paciente es HIGH', () => {
      expect(
        deriveHealthRisk(
          acceso({ operation: 'UPDATE', entity: 'PATIENT_PROFILE' }),
        ),
      ).toBe('HIGH');
    });
  });

  describe('LOW', () => {
    it('una mutación sin datos de salud', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'CATALOG_ANNOTATION_SAVED',
            entity: 'catalog_annotation',
            route: '/admin/catalog/objects/:id/annotation',
            method: 'PUT',
          }),
        ),
      ).toBe('LOW');
    });

    it('«asignación» de turnos no es un cambio de permisos', () => {
      expect(
        deriveHealthRisk(
          mutacion({
            action: 'SHIFT_ASSIGNED',
            entity: 'shift_assignment',
            route: null,
            method: null,
          }),
        ),
      ).toBe('LOW');
    });

    it('leer la propia bitácora no toca a un paciente', () => {
      expect(deriveHealthRisk(acceso({ entity: 'AUDIT_LOG' }))).toBe('LOW');
    });
  });
});
