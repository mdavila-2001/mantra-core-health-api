import {
  toGrantFacts,
  supportActionInputsOfPermissionIds,
} from './support-grant-facts';
import {
  SUPPORT_CONDITION_SCHEMA_VERSION,
  evaluateSupportAccess,
  permissionAtomId,
  supportPermissionId,
  type EngagementFacts,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { AUTHZ } from '../../authz/authz.concepts';

const NOW = new Date('2026-11-03T14:30:00Z'); // martes 10:30 en La Paz

const grantRow = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'g1',
    organizationUserAssignmentId: 'eng-1',
    targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
    practitionerRoleAssignmentId: 'pra-rojas',
    expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
    ...overrides,
  }) as any;

const engagement = (grants: EngagementFacts['grants']): EngagementFacts => ({
  engagementId: 'eng-1',
  active: true,
  acceptances: [
    { practitionerProfileId: 'prof-rojas', mayReplyOnBehalf: false },
  ],
  grants,
});

describe('toGrantFacts (gobierno de accesos)', () => {
  it('sin filas de acción se comporta como siempre: alias por permissionIds, ALLOW, sin condición', () => {
    const facts = toGrantFacts(
      grantRow(),
      [supportPermissionId('schedule.view')],
      'prof-rojas',
    );
    expect(facts.actions).toEqual(['schedule.view']);
    expect(facts.effect).toBe('ALLOW');
    expect(facts.condition).toBeUndefined();
    expect(facts.atomGrants).toBeUndefined();
    expect(facts.unreadable).toBeUndefined();
  });

  it('un átomo escrito como átomo entra como código de átomo y un alias sigue siendo alias', () => {
    expect(
      supportActionInputsOfPermissionIds([
        supportPermissionId('schedule.cancel'),
        permissionAtomId('agenda.appointment.view'),
        'id-desconocido',
      ]),
    ).toEqual(['schedule.cancel', 'agenda.appointment.view']);
  });

  it('las filas de acción vigentes aportan el átomo con su condición; las reemplazadas se descartan', () => {
    const condition = {
      schemaVersion: 1,
      appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
    };
    const facts = toGrantFacts(grantRow(), [], 'prof-rojas', [
      {
        permissionId: permissionAtomId('agenda.appointment.cancel'),
        conditionJson: condition,
        conditionSchemaVersion: 1,
        supersededAt: null,
      },
      {
        permissionId: supportPermissionId('schedule.view'),
        supersededAt: new Date('2026-10-01'),
      },
      {
        permissionId: permissionAtomId('agenda.appointment.view'),
        supersededAt: null,
      },
    ]);
    expect(facts.actions).toEqual([
      'agenda.appointment.cancel',
      'agenda.appointment.view',
    ]);
    expect(facts.atomGrants).toEqual([
      { atom: 'agenda.appointment.cancel', origin: 'ATOM', condition },
    ]);
  });

  it('una concesión DENY (concepto authz:EFFECT_DENY) se marca DENY y con ella el motor niega', () => {
    const deny = toGrantFacts(
      grantRow({ id: 'g-deny', effectConceptId: AUTHZ.EFFECT_DENY }),
      [permissionAtomId('agenda.appointment.view.reason')],
      'prof-rojas',
    );
    const allow = toGrantFacts(
      grantRow({ id: 'g-allow' }),
      [permissionAtomId('agenda.appointment.view.reason')],
      'prof-rojas',
    );
    expect(deny.effect).toBe('DENY');
    const verdict = evaluateSupportAccess(
      [engagement([allow, deny])],
      {
        action: 'agenda.appointment.view.reason',
        practitionerProfileId: 'prof-rojas',
        practitionerRoleAssignmentIds: ['pra-rojas'],
      },
      NOW,
    );
    expect(verdict).toMatchObject({
      allowed: false,
      reason: 'EXPLICIT_DENY',
      grantId: 'g-deny',
    });
  });

  it('SEG A-B3: una DENY con tipo de objetivo desconocido NIEGA (a todo objetivo); una ALLOW con tipo desconocido no concede nada', () => {
    // PoC revision-seg-a/deny.ts: antes la DENY rota quedaba `active=false` y no negaba.
    const allow = toGrantFacts(
      grantRow({ id: 'g-allow' }),
      [permissionAtomId('agenda.appointment.view.reason')],
      'prof-rojas',
    );
    const brokenDeny = toGrantFacts(
      grantRow({
        id: 'g-deny-roto',
        targetKindConceptId: 'tipo-de-objetivo-desconocido',
        effectConceptId: AUTHZ.EFFECT_DENY,
      }),
      [permissionAtomId('agenda.appointment.view.reason')],
      undefined,
    );
    expect(brokenDeny.effect).toBe('DENY');
    expect(brokenDeny.active).toBe(true);
    const verdict = evaluateSupportAccess(
      [engagement([allow, brokenDeny])],
      {
        action: 'agenda.appointment.view.reason',
        practitionerProfileId: 'prof-rojas',
        practitionerRoleAssignmentIds: ['pra-rojas'],
      },
      NOW,
    );
    expect(verdict).toMatchObject({
      allowed: false,
      reason: 'EXPLICIT_DENY',
      grantId: 'g-deny-roto',
    });

    const brokenAllow = toGrantFacts(
      grantRow({ targetKindConceptId: 'tipo-de-objetivo-desconocido' }),
      [permissionAtomId('agenda.appointment.view.reason')],
      undefined,
    );
    expect(brokenAllow.active).toBe(false);
  });

  it('un efecto desconocido falla cerrado: se trata como DENY', () => {
    const facts = toGrantFacts(
      grantRow({ effectConceptId: 'concepto-raro' }),
      [supportPermissionId('schedule.view')],
      'prof-rojas',
    );
    expect(facts.effect).toBe('DENY');
  });

  it('la condición del permiso y la del átomo se leen con su versión', () => {
    const facts = toGrantFacts(
      grantRow({
        conditionJson: {
          schemaVersion: 1,
          time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
        },
        conditionSchemaVersion: 1,
      }),
      [permissionAtomId('agenda.appointment.view')],
      'prof-rojas',
    );
    expect(facts.condition?.schemaVersion).toBe(
      SUPPORT_CONDITION_SCHEMA_VERSION,
    );
    expect(facts.unreadable).toBeUndefined();
  });

  it('versión mayor a la soportada, JSON que no es objeto o versión que no coincide con la columna: ilegible y no candidata', () => {
    const futureCondition = toGrantFacts(
      grantRow({
        conditionJson: { schemaVersion: 2 },
        conditionSchemaVersion: 2,
      }),
      [supportPermissionId('schedule.view')],
      'prof-rojas',
    );
    const garbage = toGrantFacts(
      grantRow({ conditionJson: 'no soy objeto', conditionSchemaVersion: 1 }),
      [supportPermissionId('schedule.view')],
      'prof-rojas',
    );
    const mismatch = toGrantFacts(
      grantRow({
        conditionJson: { schemaVersion: 1 },
        conditionSchemaVersion: 7,
      }),
      [supportPermissionId('schedule.view')],
      'prof-rojas',
    );
    for (const facts of [futureCondition, garbage, mismatch]) {
      expect(facts.unreadable).toBe(true);
      const verdict = evaluateSupportAccess(
        [engagement([facts])],
        {
          action: 'schedule.view',
          practitionerProfileId: 'prof-rojas',
          practitionerRoleAssignmentIds: ['pra-rojas'],
        },
        NOW,
      );
      expect(verdict.allowed).toBe(false);
      expect(verdict.reason).toBe('CONDITION_UNREADABLE');
    }
  });

  it('una condición ilegible en la fila de un átomo solo cierra ese átomo', () => {
    const facts = toGrantFacts(grantRow(), [], 'prof-rojas', [
      {
        permissionId: permissionAtomId('agenda.appointment.cancel'),
        conditionJson: { schemaVersion: 9 },
        conditionSchemaVersion: 9,
      },
      { permissionId: permissionAtomId('agenda.appointment.view') },
    ]);
    const ask = (action: string) =>
      evaluateSupportAccess(
        [engagement([facts])],
        {
          action: action as any,
          practitionerProfileId: 'prof-rojas',
          practitionerRoleAssignmentIds: ['pra-rojas'],
        },
        NOW,
      );
    expect(ask('agenda.appointment.cancel')).toMatchObject({
      allowed: false,
      reason: 'CONDITION_UNREADABLE',
    });
    expect(ask('agenda.appointment.view').allowed).toBe(true);
  });
});
