import { describe, it, expect } from '@jest/globals';
import { CLINICAL_ROLE_SEED } from '../authz/authz.seed';
import {
  CLINICAL_ROLES,
  canReadProfessionalContent,
  isProfessionalOnly,
  sourceAgeOf,
  visibleProperties,
} from './pharmacology-audience';

const RETRIEVED = '2026-10-24T17:00:00.000Z';

describe('pharmacology-audience', () => {
  describe('roles que ven contenido professional', () => {
    it('son los asistenciales del catálogo de actores y el SUPERADMIN de plataforma', () => {
      const clinical = CLINICAL_ROLE_SEED.filter(
        (role) => role.baseRole === 'CLINICAL',
      ).map((role) => role.code);
      expect(clinical).toContain('CLINICIAN');
      expect(clinical).toContain('PRACTITIONER');
      expect([...CLINICAL_ROLES].sort()).toEqual([...clinical].sort());
      expect(canReadProfessionalContent({ roles: ['SUPERADMIN'] })).toBe(true);
    });

    it('un SUPERADMIN acotado a un tenant no es el comodín de plataforma', () => {
      expect(
        canReadProfessionalContent({
          roles: ['SUPERADMIN'],
          scopedRoles: { 'tenant-1': ['SUPERADMIN'] },
        }),
      ).toBe(false);
    });

    it('un rol clínico acotado a un tenant sí lee: el catálogo no tiene tenant', () => {
      expect(
        canReadProfessionalContent({
          roles: ['CLINICIAN'],
          scopedRoles: { 'tenant-1': ['CLINICIAN'] },
        }),
      ).toBe(true);
    });

    it('un administrador de seguridad, un paciente o un usuario común no son clínicos', () => {
      for (const role of [
        'SECURITY_ADMIN',
        'PATIENT',
        'USER',
        'PERIOP_ADMIN',
      ]) {
        expect(canReadProfessionalContent({ roles: [role] })).toBe(false);
      }
      expect(canReadProfessionalContent(undefined)).toBe(false);
      expect(canReadProfessionalContent({ roles: [] })).toBe(false);
    });

    it('basta uno de varios roles', () => {
      expect(
        canReadProfessionalContent({ roles: ['USER', 'PATIENT', 'CLINICIAN'] }),
      ).toBe(true);
    });
  });

  describe('visibleProperties', () => {
    const catalog = { propertyCode: 'a', valueJson: 5 };
    const text = { propertyCode: 'b', valueJson: 'texto' };
    const nested = { propertyCode: 'c', valueJson: { audience: 'public' } };
    const pro = {
      propertyCode: 'd',
      valueJson: { audience: 'professional', text: 'posología' },
    };

    it('omite solo las professional para quien no es clínico', () => {
      expect(
        visibleProperties([catalog, text, nested, pro], { roles: ['PATIENT'] }),
      ).toEqual([catalog, text, nested]);
    });

    it('devuelve todo a un rol clínico, sin mutar el original', () => {
      const all = [catalog, pro];
      const seen = visibleProperties(all, { roles: ['CLINICIAN'] });
      expect(seen).toEqual(all);
      expect(seen).not.toBe(all);
    });

    it('valores que no son objetos nunca son professional', () => {
      for (const value of [
        null,
        undefined,
        'professional',
        3,
        ['professional'],
      ]) {
        expect(isProfessionalOnly(value)).toBe(false);
      }
    });
  });

  describe('sourceAgeOf', () => {
    it('una propiedad que no es una sección no tiene antigüedad', () => {
      for (const value of [
        5,
        'IV',
        null,
        [],
        { document: { id: 'x' } },
        { retrievedAt: RETRIEVED },
      ]) {
        expect(sourceAgeOf(value)).toBeUndefined();
      }
    });

    it('CIMA con fecha de la ficha: conocida', () => {
      expect(
        sourceAgeOf({
          retrievedAt: RETRIEVED,
          document: { version: '2017-04-28T11:24:08.000Z' },
        }),
      ).toEqual({
        known: true,
        sourceDate: '2017-04-28T11:24:08.000Z',
        retrievedAt: RETRIEVED,
      });
    });

    it('CIMA con fecha solo en el texto (sección 10): conocida', () => {
      expect(
        sourceAgeOf({
          retrievedAt: RETRIEVED,
          document: { version: null, revisionDateInText: '10/2023' },
        }),
      ).toEqual({ known: true, sourceDate: '10/2023', retrievedAt: RETRIEVED });
    });

    it('openFDA: manda effective_time y no el número de versión del SPL', () => {
      expect(
        sourceAgeOf({
          retrievedAt: RETRIEVED,
          document: { version: '5', effectiveDate: '2024-10-30' },
        }),
      ).toEqual({
        known: true,
        sourceDate: '2024-10-30',
        retrievedAt: RETRIEVED,
      });
    });

    it('una versión que no es una fecha no cuenta como antigüedad', () => {
      expect(
        sourceAgeOf({ retrievedAt: RETRIEVED, document: { version: '5' } }),
      ).toEqual({ known: false, retrievedAt: RETRIEVED });
    });

    it('ficha sin fecha publicada (versionUnpublished): desconocida, vale la fecha de consulta', () => {
      expect(
        sourceAgeOf({
          retrievedAt: RETRIEVED,
          document: {
            version: null,
            revisionDateInText: null,
            versionUnpublished: true,
            versionNote: 'CIMA no publica la fecha de esta ficha técnica',
          },
        }),
      ).toEqual({ known: false, retrievedAt: RETRIEVED });
    });

    it('versionUnpublished manda aunque haya otro campo de fecha', () => {
      expect(
        sourceAgeOf({
          retrievedAt: RETRIEVED,
          document: { versionUnpublished: true, effectiveDate: '2024-01-01' },
        }),
      ).toEqual({ known: false, retrievedAt: RETRIEVED });
    });
  });
});
