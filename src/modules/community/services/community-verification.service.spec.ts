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

const AYER = new Date(Date.now() - 24 * 3_600_000);
const MANANA = new Date(Date.now() + 24 * 3_600_000);

/** Un sello con los campos que la lectura mira. */
function sello(over: Record<string, unknown> = {}): any {
  return {
    id: 'badge-1',
    subjectRefId: 'perfil-1',
    badgeTypeConceptId: COMM.BADGE_TYPE_LICENSE_VERIFIED,
    verificationMethodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    validFrom: AYER,
    validTo: null,
    ...over,
  };
}

/** Un perfil público de profesional. */
const perfil: any = {
  id: 'perfil-1',
  targetId: 'sujeto-1',
  targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  verificationStatusConceptId: CONCEPTS.STATE_PENDING,
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param opciones - Perfil y sellos que devuelve el repositorio.
 * @returns Resultado de build.
 */
function build(opciones?: { profile?: any; badges?: any[]; existente?: any }) {
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
      opciones?.profile === undefined ? { ...perfil } : opciones.profile,
    ),
    findActive: mockFn().mockResolvedValue(opciones?.existente ?? null),
    findAllBySubject: mockFn().mockResolvedValue(opciones?.badges ?? []),
    findExpired: mockFn().mockResolvedValue([]),
    grant: mockFn((_em: any, data: any, existente: any) =>
      existente
        ? { badge: existente, created: false }
        : { badge: sello({ id: 'badge-new', ...data }), created: true },
    ),
    revoke: mockFn((badge: any, _actor: string, motivo: string) => {
      badge.statusConceptId =
        motivo === 'REVOKED' ? CONCEPTS.STATE_REVOKED : CONCEPTS.STATE_EXPIRED;
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
      const profile = { ...perfil };
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
      const existente = sello();
      const d = build({ existente });

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
        ...perfil,
        verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      const activo = sello();
      const d = build({ profile, badges: [activo] });

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
        ...perfil,
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

      const badge = d.service.readBadge(perfil, [sello()]);

      expect(badge.status).toBe('VERIFIED');
      expect(badge.badgeTypeConceptId).toBe(COMM.BADGE_TYPE_LICENSE_VERIFIED);
      expect(badge.verificationMethodConceptId).toBe(
        COMM.BADGE_METHOD_AUTHORITY_CHECK,
      );
    });

    it('un sello cuya ventana ya pasó NO es VERIFIED aunque siga marcado activo', () => {
      const d = build();

      const badge = d.service.readBadge(perfil, [sello({ validTo: AYER })]);

      // La ventana manda sobre el estado: es lo que hace que un sello vencido
      // no siga luciendo mientras el barrido no pasó todavía.
      expect(badge.status).toBe('EXPIRED');
      expect(badge.validUntil).toBe(AYER.toISOString());
    });

    it('un sello que todavía no empezó tampoco es VERIFIED', () => {
      const d = build();

      const badge = d.service.readBadge(perfil, [
        sello({ validFrom: MANANA, validTo: null }),
      ]);

      expect(badge.status).not.toBe('VERIFIED');
    });

    it('sin ningún sello es NONE, no EXPIRED', () => {
      const d = build();

      const badge = d.service.readBadge(perfil, []);

      // «Nunca se verificó» y «se le venció» son cosas distintas para quien
      // elige un médico, y por eso no comparten estado.
      expect(badge.status).toBe('NONE');
      expect(badge.badgeTypeConceptId).toBeNull();
    });

    it('un sello revocado deja EXPIRED con la fecha en que dejó de valer', () => {
      const d = build();

      const badge = d.service.readBadge(perfil, [
        sello({ statusConceptId: CONCEPTS.STATE_REVOKED, validTo: AYER }),
      ]);

      expect(badge.status).toBe('EXPIRED');
      expect(badge.validUntil).toBe(AYER.toISOString());
    });

    it('con dos sellos gana el vigente', () => {
      const d = build();

      const badge = d.service.readBadge(perfil, [
        sello({
          id: 'viejo',
          statusConceptId: CONCEPTS.STATE_REVOKED,
          validTo: AYER,
        }),
        sello({ id: 'nuevo' }),
      ]);

      expect(badge.status).toBe('VERIFIED');
    });
  });

  describe('el término de prestigio sale del sello, no de la columna resumen', () => {
    it('suma con sello vigente', () => {
      const d = build();
      expect(d.service.verificationTerm(perfil, [sello()])).toBe(1);
    });

    it('no resta con sello vencido: renovar la matrícula no es un castigo', () => {
      const d = build();
      expect(
        d.service.verificationTerm(perfil, [sello({ validTo: AYER })]),
      ).toBe(0);
    });

    it('un perfil marcado como verificado sin sello detrás NO suma', () => {
      const d = build();
      const mentiroso = {
        ...perfil,
        verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
      };

      // Es la prueba de que el prestigio se ata al sello con evidencia y no a
      // la columna, que es lo que se puede desincronizar.
      expect(d.service.verificationTerm(mentiroso, [])).toBe(0);
    });
  });
});
