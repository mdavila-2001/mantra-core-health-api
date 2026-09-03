import {
  requiereCriterioDeBusqueda,
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
    (rol) => {
      expect(resolvePatientSearchScope(actor([rol]))).toEqual({
        kind: 'unrestricted',
      });
    },
  );
});

describe('requiereCriterioDeBusqueda', () => {
  it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
    '%s administra el padrón: no necesita criterio',
    (rol) => {
      expect(requiereCriterioDeBusqueda(actor([rol]))).toBe(false);
    },
  );

  it.each(['PRACTITIONER', 'CLINICIAN'])(
    '%s es un rol clínico: necesita al menos un criterio',
    (rol) => {
      expect(requiereCriterioDeBusqueda(actor([rol]))).toBe(true);
    },
  );
});
