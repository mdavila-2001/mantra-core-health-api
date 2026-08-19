import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { COMM } from '../community.concepts';
import { CommunityVerificationController } from './community-verification.controller';

/** Roles exigidos por un handler del controlador. */
function rolesDe(metodo: string): string[] | undefined {
  return Reflect.getMetadata(
    ROLES_KEY,
    (
      CommunityVerificationController.prototype as never as Record<
        string,
        object
      >
    )[metodo],
  );
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const tx = {};
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const service = {
    applyVerified: mockFn().mockResolvedValue({ action: 'granted' }),
    applyRevoked: mockFn().mockResolvedValue({ revoked: 1 }),
    expireSweep: mockFn().mockResolvedValue({ expired: 0, profiles: 0 }),
  };
  const controller = new CommunityVerificationController(
    em as any,
    service as any,
  );
  return { controller, service, tx };
}

describe('CommunityVerificationController', () => {
  describe('la escotilla manual está cerrada con llave', () => {
    it('el alta de un sello exige SECURITY_ADMIN', () => {
      // El camino normal del sello es el puente desde identity_assurance. Esto
      // no es una segunda puerta al mismo sitio: si dejara de pedir el rol,
      // cualquiera con sesión podría fabricarse un «Verificado».
      expect(rolesDe('grant')).toEqual(['SECURITY_ADMIN']);
    });

    it('la baja también', () => {
      expect(rolesDe('revoke')).toEqual(['SECURITY_ADMIN']);
    });

    it('el barrido lo puede correr el worker, además del administrador', () => {
      expect(rolesDe('expireSweep')).toEqual(['SYSTEM', 'SECURITY_ADMIN']);
    });

    it('ningún handler queda sin roles: no hay superficie pública acá', () => {
      for (const metodo of ['grant', 'revoke', 'expireSweep']) {
        expect(rolesDe(metodo)).toBeDefined();
      }
    });
  });

  describe('el alta manual queda marcada como manual', () => {
    it('usa el método MANUAL_ADMIN, nunca el de autoridad externa', async () => {
      const d = build();

      await d.controller.grant(
        { targetId: 'sujeto-1', evidenceRef: 'acta-2026-08' } as any,
        { id: 'admin-1' } as any,
      );

      const [[, outcome]] = d.service.applyVerified.mock.calls;
      // Si un alta manual se registrara como verificación de autoridad, una
      // auditoría no podría separarlas nunca más.
      expect(outcome.methodConceptId).toBe(COMM.BADGE_METHOD_MANUAL_ADMIN);
      expect(outcome.actorUserId).toBe('admin-1');
      expect(outcome.evidenceRef).toBe('acta-2026-08');
    });

    it('la baja por omisión es revocación, no vencimiento', async () => {
      const d = build();

      await d.controller.revoke(
        'sujeto-1',
        {} as any,
        { id: 'admin-1' } as any,
      );

      const [[, , , motivo]] = d.service.applyRevoked.mock.calls;
      expect(motivo).toBe('REVOKED');
    });
  });
});
