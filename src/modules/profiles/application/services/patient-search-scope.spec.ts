import {
  searchRequiresCriterion,
  resolvePatientSearchScope,
} from './patient-search-scope';

function actor(roles: readonly string[]) {
  return { id: 'u-1', roles: [...roles] } as any;
}

describe('resolvePatientSearchScope', () => {
  // P-07-10 (2026-09-02): revierte el acotamiento por actividad del mismo
  // día — los cuatro roles que llegan al endpoint ven el mismo padrón, sin
  // acotar, porque la búsqueda también sirve para registrar a quien nunca se
  // atendió.
  it.each(['SECURITY_ADMIN', 'SUPERADMIN', 'PRACTITIONER', 'CLINICIAN'])(
    '%s ve el padrón sin acotar',
    (role) => {
      expect(resolvePatientSearchScope(actor([role]))).toEqual({
        kind: 'unrestricted',
      });
    },
  );
});

describe('requiereCriterioDeBusqueda', () => {
  it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
    '%s administra el padrón: no necesita criterio',
    (role) => {
      expect(searchRequiresCriterion(actor([role]))).toBe(false);
    },
  );

  it.each(['PRACTITIONER', 'CLINICIAN'])(
    '%s es un rol clínico: necesita al menos un criterio',
    (role) => {
      expect(searchRequiresCriterion(actor([role]))).toBe(true);
    },
  );
});
