import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import { PatientRepresentationService } from './patient-representation.service';

const tutor = { id: 'user-tutor', roles: ['USER', 'PATIENT'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * Por omisión la cuenta es la de `person-1`, el paciente consultado es el suyo
 * y no hay ningún apoderamiento: el caso del titular que actúa sobre sí mismo.
 *
 * @returns El servicio y sus dobles.
 */
function build({
  link = { personId: 'person-1' },
  patient = { profileId: 'person-1' },
  proxy = null,
  proxies = [],
}: {
  link?: unknown;
  patient?: unknown;
  proxy?: unknown;
  proxies?: unknown[];
} = {}) {
  const accountLinksRepo = { findActiveByUser: fn().mockResolvedValue(link) };
  const patientProfilesRepo = { findById: fn().mockResolvedValue(patient) };
  const portalProxiesRepo = {
    findActiveByProxyUserAndPatient: fn().mockResolvedValue(proxy),
    findActiveByProxyUser: fn().mockResolvedValue(proxies),
  };
  const em = { fork: fn(() => ({ marca: 'bifurcado' })) };
  const service = new PatientRepresentationService(
    em as never,
    accountLinksRepo as never,
    patientProfilesRepo as never,
    portalProxiesRepo as never,
  );
  return {
    service,
    em,
    accountLinksRepo,
    patientProfilesRepo,
    portalProxiesRepo,
    tx: { marca: 'transaccion' } as never,
  };
}

describe('PatientRepresentationService', () => {
  describe('representsPatient', () => {
    it('el titular puede actuar sobre sí mismo sin mirar apoderamientos', async () => {
      const { service, portalProxiesRepo, tx } = build();

      expect(await service.representsPatient('person-1', tutor, tx)).toBe(true);
      // Si preguntara igual por el apoderamiento, cada lectura propia pagaría
      // una consulta de más sobre una tabla que casi siempre está vacía.
      expect(
        portalProxiesRepo.findActiveByProxyUserAndPatient,
      ).not.toHaveBeenCalled();
    });

    it('quien no es el titular pasa si tiene apoderamiento vigente', async () => {
      const { service, portalProxiesRepo, tx } = build({
        patient: { profileId: 'person-dependiente' },
        proxy: { id: 'proxy-1', patientProfileId: 'person-dependiente' },
      });

      expect(
        await service.representsPatient('person-dependiente', tutor, tx),
      ).toBe(true);
      expect(
        portalProxiesRepo.findActiveByProxyUserAndPatient,
      ).toHaveBeenCalledWith(
        tx,
        'user-tutor',
        'person-dependiente',
        expect.any(Date),
      );
    });

    it('sin apoderamiento no pasa, aunque el paciente exista', async () => {
      const { service } = build({
        patient: { profileId: 'person-ajena' },
        proxy: null,
      });

      expect(await service.representsPatient('person-ajena', tutor)).toBe(
        false,
      );
    });

    it('una cuenta sin persona vinculada no es titular de nada', async () => {
      // El profesional que nunca fue paciente, o una cuenta a medio crear: sin
      // vínculo no se puede comparar contra nada y no se inventa una identidad.
      const { service, patientProfilesRepo } = build({ link: null });

      expect(await service.representsPatient('person-1', tutor)).toBe(false);
      expect(patientProfilesRepo.findById).not.toHaveBeenCalled();
    });

    it('un uuid que no es de ningún paciente no pasa', async () => {
      const { service } = build({ patient: null });

      expect(await service.representsPatient('inventado', tutor)).toBe(false);
    });

    it('sin transacción activa bifurca el contexto en vez de usar el compartido', async () => {
      const { service, em, accountLinksRepo } = build();

      await service.representsPatient('person-1', tutor);

      expect(em.fork).toHaveBeenCalled();
      expect(accountLinksRepo.findActiveByUser).toHaveBeenCalledWith(
        { marca: 'bifurcado' },
        'user-tutor',
      );
    });
  });

  describe('findActiveProxiedPatientIds', () => {
    it('devuelve los pacientes representados, sin repetir', async () => {
      const { service } = build({
        proxies: [
          { patientProfileId: 'dep-1' },
          { patientProfileId: 'dep-2' },
          { patientProfileId: 'dep-1' },
        ],
      });

      const ids = await service.findActiveProxiedPatientIds('user-tutor');

      expect([...ids].sort()).toEqual(['dep-1', 'dep-2']);
    });

    it('sin apoderamientos devuelve un conjunto vacío, no null', async () => {
      // Lo consume una proyección que decide fila a fila: un `null` ahí
      // obligaría a cada consumidor a defenderse.
      const { service } = build();

      expect(await service.findActiveProxiedPatientIds('user-tutor')).toEqual(
        new Set(),
      );
    });
  });

  describe('assertMayActForPatient', () => {
    it('no lanza cuando puede actuar', async () => {
      const { service, tx } = build();

      await expect(
        service.assertMayActForPatient('person-1', tutor, tx),
      ).resolves.toBeUndefined();
    });

    it('rechaza con el mismo mensaje al intruso y al uuid inventado', async () => {
      // El rechazo tiene que ser indistinguible: si el paciente ajeno diera un
      // mensaje distinto del inventado, probar uuids confirmaría quién existe.
      const ajeno = build({ patient: { profileId: 'person-ajena' } });
      const inventado = build({ patient: null });

      const capturar = async (s: PatientRepresentationService) => {
        try {
          await s.assertMayActForPatient('x', tutor);
          return null;
        } catch (error) {
          return error as ForbiddenException;
        }
      };

      const errorAjeno = await capturar(ajeno.service);
      const errorInventado = await capturar(inventado.service);

      expect(errorAjeno).toBeInstanceOf(ForbiddenException);
      expect(errorInventado).toBeInstanceOf(ForbiddenException);
      expect(errorInventado!.message).toBe(errorAjeno!.message);
      expect(errorAjeno!.message).toBe(
        'No cuenta con autorización de tutoría sobre el paciente indicado',
      );
    });
  });
});
