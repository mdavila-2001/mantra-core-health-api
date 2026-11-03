import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { CommunityVerificationService } from './community-verification.service';

const YESTERDAY = new Date(Date.now() - 24 * 3_600_000);
const TOMORROW = new Date(Date.now() + 24 * 3_600_000);

/** Un sello con los campos que la lectura mira. */
function stamp(over: Record<string, unknown> = {}): any {
  return {
    id: 'badge-1',
    subjectRefId: 'perfil-1',
    badgeTypeConceptId: COMM.BADGE_TYPE_LICENSE_VERIFIED,
    verificationMethodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    validFrom: YESTERDAY,
    validTo: null,
    ...over,
  };
}

/** Un perfil público de profesional. */
const publicProfile: any = {
  id: 'perfil-1',
  targetId: 'sujeto-1',
  targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  verificationStatusConceptId: CONCEPTS.STATE_PENDING,
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Perfil y sellos que devuelve el repositorio.
 * @returns Resultado de build.
 */
function build(options?: { profile?: any; badges?: any[]; existente?: any }) {
  const tx = {
    create: mockFn((_e: any, d: any) => ({ ...d, id: 'badge-new' })),
    // El alta hace un flush antes de anotar la auditoría: el historial apunta
    // al sello por uuid y sin ese flush la FK lo rechaza (lo encontró la
    // corrida contra la API viva, no estas pruebas).
    flush: mockFn().mockResolvedValue(undefined),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findProfileByTarget: mockFn().mockResolvedValue(
      options?.profile === undefined ? { ...publicProfile } : options.profile,
    ),
    findActive: mockFn().mockResolvedValue(options?.existente ?? null),
    findAllBySubject: mockFn().mockResolvedValue(options?.badges ?? []),
    findExpired: mockFn().mockResolvedValue([]),
    grant: mockFn((_em: any, data: any, existing: any) =>
      existing
        ? { badge: existing, created: false }
        : { badge: stamp({ id: 'badge-new', ...data }), created: true },
    ),
    revoke: mockFn((badge: any, _actor: string, reason: string) => {
      badge.statusConceptId =
        reason === 'REVOKED' ? CONCEPTS.STATE_REVOKED : CONCEPTS.STATE_EXPIRED;
    }),
    recordHistory: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityVerificationService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo, tx, logger };
}

describe('CommunityVerificationService', () => {
  describe('el sello sólo nace de una verificación real', () => {
    it('emite el sello y deja el perfil verificado', async () => {
      const d = build();
      const profile = { ...publicProfile };
      d.repo.findProfileByTarget.mockResolvedValue(profile);

      const res = await d.service.applyVerified(d.tx as any, {
        targetId: 'sujeto-1',
        methodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
        actorUserId: 'system',
        evidenceRef: 'identity_verification_case:caso-1',
      });

      expect(res.action).toBe('granted');
      expect(profile.verificationStatusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      expect(d.repo.recordHistory).toHaveBeenCalled();
    });

    it('una re-verificación renueva el sello en vez de apilar un segundo', async () => {
      const existing = stamp();
      const d = build({ existente: existing });

      const res = await d.service.applyVerified(d.tx as any, {
        targetId: 'sujeto-1',
        methodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
        actorUserId: 'system',
      });

      // Dos sellos vigentes del mismo tipo serían dos respuestas a «¿desde
      // cuándo está verificado?».
      expect(res.action).toBe('renewed');
    });

    it('un sujeto verificado sin vitrina pública no es un error', async () => {
      const d = build({ profile: null });

      const res = await d.service.applyVerified(d.tx as any, {
        targetId: 'sujeto-sin-vitrina',
        methodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
        actorUserId: 'system',
      });

      expect(res.action).toBe('no-profile');
      expect(d.repo.grant).not.toHaveBeenCalled();
    });

    it('el sello dice cómo se verificó: manual y automático no se confunden', async () => {
      const d = build();

      await d.service.applyVerified(d.tx as any, {
        targetId: 'sujeto-1',
        methodConceptId: COMM.BADGE_METHOD_MANUAL_ADMIN,
        actorUserId: 'admin-1',
      });

      const [[, data]] = d.repo.grant.mock.calls;
      expect(data.verificationMethodConceptId).toBe(
        COMM.BADGE_METHOD_MANUAL_ADMIN,
      );
    });
  });

  describe('revocación', () => {
    it('baja los sellos vigentes y deja el perfil en VENCIDO, no en PENDIENTE', async () => {
      const profile = {
        ...publicProfile,
        verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      const active = stamp();
      const d = build({ profile, badges: [active] });

      const res = await d.service.applyRevoked(
        d.tx as any,
        'sujeto-1',
        'admin',
      );

      expect(res.revoked).toBe(1);
      // PENDIENTE diría «nunca se verificó», que es falso, y la pantalla no
      // podría decir «Verificación vencida».
      expect(profile.verificationStatusConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });

    it('el resumen cae aunque no hubiera sello que bajar', async () => {
      const profile = {
        ...publicProfile,
        verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      const d = build({ profile, badges: [] });

      await d.service.applyRevoked(d.tx as any, 'sujeto-1', 'admin');

      // Un perfil marcado como verificado sin ningún sello detrás es el estado
      // inconsistente que este carril hace imposible.
      expect(profile.verificationStatusConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });
  });

  describe('readBadge: una sola semántica para todas las superficies', () => {
    it('un sello vigente es VERIFIED con su procedencia', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, [stamp()]);

      expect(badge.status).toBe('VERIFIED');
      expect(badge.badgeTypeConceptId).toBe(COMM.BADGE_TYPE_LICENSE_VERIFIED);
      expect(badge.verificationMethodConceptId).toBe(
        COMM.BADGE_METHOD_AUTHORITY_CHECK,
      );
    });

    it('un sello cuya ventana ya pasó NO es VERIFIED aunque siga marcado activo', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, [
        stamp({ validTo: YESTERDAY }),
      ]);

      // La ventana manda sobre el estado: es lo que hace que un sello vencido
      // no siga luciendo mientras el barrido no pasó todavía.
      expect(badge.status).toBe('EXPIRED');
      expect(badge.validUntil).toBe(YESTERDAY.toISOString());
    });

    it('un sello que todavía no empezó tampoco es VERIFIED', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, [
        stamp({ validFrom: TOMORROW, validTo: null }),
      ]);

      expect(badge.status).not.toBe('VERIFIED');
    });

    it('sin ningún sello es NONE, no EXPIRED', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, []);

      // «Nunca se verificó» y «se le venció» son cosas distintas para quien
      // elige un médico, y por eso no comparten estado.
      expect(badge.status).toBe('NONE');
      expect(badge.badgeTypeConceptId).toBeNull();
    });

    it('un sello revocado deja EXPIRED con la fecha en que dejó de valer', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, [
        stamp({ statusConceptId: CONCEPTS.STATE_REVOKED, validTo: YESTERDAY }),
      ]);

      expect(badge.status).toBe('EXPIRED');
      expect(badge.validUntil).toBe(YESTERDAY.toISOString());
    });

    it('con dos sellos gana el vigente', () => {
      const d = build();

      const badge = d.service.readBadge(publicProfile, [
        stamp({
          id: 'viejo',
          statusConceptId: CONCEPTS.STATE_REVOKED,
          validTo: YESTERDAY,
        }),
        stamp({ id: 'nuevo' }),
      ]);

      expect(badge.status).toBe('VERIFIED');
    });
  });

  describe('el término de prestigio sale del sello, no de la columna resumen', () => {
    it('suma con sello vigente', () => {
      const d = build();
      expect(d.service.verificationTerm(publicProfile, [stamp()])).toBe(1);
    });

    it('no resta con sello vencido: renovar la matrícula no es un castigo', () => {
      const d = build();
      expect(
        d.service.verificationTerm(publicProfile, [
          stamp({ validTo: YESTERDAY }),
        ]),
      ).toBe(0);
    });

    it('un perfil marcado como verificado sin sello detrás NO suma', () => {
      const d = build();
      const lying = {
        ...publicProfile,
        verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
      };

      // Es la prueba de que el prestigio se ata al sello con evidencia y no a
      // la columna, que es lo que se puede desincronizar.
      expect(d.service.verificationTerm(lying, [])).toBe(0);
    });
  });
});
