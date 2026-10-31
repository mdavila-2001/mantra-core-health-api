import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { mapGovernanceDbError, readDbViolation } from './governance-db-errors';

const pg = (code: string, constraint?: string, message = 'x') =>
  Object.assign(new Error(message), { code, constraint });
/** El ORM envuelve el error del driver en `cause`. */
const wrapped = (inner: Error) =>
  Object.assign(new Error('driver'), { cause: inner });

describe('mapGovernanceDbError (23514 / 23503 / 23505 / 23001)', () => {
  it('lee el SQLSTATE aunque el ORM lo envuelva', () => {
    expect(
      readDbViolation(wrapped(pg('23505', 'uq_governance_rules_active'))),
    ).toMatchObject({
      sqlstate: '23505',
      constraint: 'uq_governance_rules_active',
    });
    expect(readDbViolation(new Error('sin código'))).toBeUndefined();
  });

  it('23514 auto-aprobación del cuatro ojos ⇒ 403 FOUR_EYES_SELF_APPROVAL', () => {
    const e = mapGovernanceDbError(
      pg('23514', 'ck_four_eyes_requests_not_self'),
    ) as DomainException;
    expect(e.getStatus()).toBe(403);
    expect(e.reason).toBe('FOUR_EYES_SELF_APPROVAL');
  });

  it('23514 hash mal formado ⇒ 409 FOUR_EYES_PAYLOAD_INVALID; comentario corto al revocar ⇒ 422 REVIEW_COMMENT_REQUIRED', () => {
    expect(
      (
        mapGovernanceDbError(
          pg('23514', 'ck_four_eyes_requests_hash'),
        ) as ConflictException
      ).reason,
    ).toBe('FOUR_EYES_PAYLOAD_INVALID');
    const comment = mapGovernanceDbError(
      pg('23514', 'ck_access_review_items_comment'),
    ) as PreconditionFailedException;
    expect(comment.getStatus()).toBe(422);
    expect(comment.reason).toBe('REVIEW_COMMENT_REQUIRED');
  });

  it('23514 condición con schemaVersion que no coincide con la columna ⇒ 422 CONDITION_SCHEMA_VERSION_UNSUPPORTED (permiso y acción)', () => {
    for (const c of [
      'ck_support_scope_grants_condition',
      'ck_support_grant_actions_condition',
    ]) {
      expect(
        (mapGovernanceDbError(pg('23514', c)) as DomainException).reason,
      ).toBe('CONDITION_SCHEMA_VERSION_UNSUPPORTED');
    }
  });

  it('23514 del disparador «revisor = titular» (sin nombre de restricción) ⇒ 403 REVIEW_NOT_REVIEWER', () => {
    const e = mapGovernanceDbError(
      pg(
        '23514',
        undefined,
        'delegated_access.access_review_items: la persona revisada (u1) no puede ser revisora, destinataria del escalamiento ni decisora de su propio acceso',
      ),
    ) as DomainException;
    expect(e.getStatus()).toBe(403);
    expect(e.reason).toBe('REVIEW_NOT_REVIEWER');
  });

  it('23505 únicos parciales ⇒ 409 con su razón', () => {
    const cases: Record<string, string> = {
      uq_four_eyes_requests_pending_payload: 'FOUR_EYES_DUPLICATE_PENDING',
      uq_governance_rules_active: 'GOVERNANCE_RULE_DUPLICATE',
      uq_access_review_campaigns_recert_month: 'REVIEW_CAMPAIGN_DUPLICATE',
      uq_lifecycle_cases_open_suspension: 'ENGAGEMENT_ALREADY_SUSPENDED',
    };
    for (const [constraint, reason] of Object.entries(cases)) {
      const e = mapGovernanceDbError(
        wrapped(pg('23505', constraint)),
      ) as ConflictException;
      expect(e.getStatus()).toBe(409);
      expect(e.reason).toBe(reason);
    }
  });

  it('23503 padre inexistente u oculto por RLS ⇒ 404 uniforme (sin decir cuál de las dos cosas)', () => {
    const e = mapGovernanceDbError(
      pg(
        '23503',
        undefined,
        'delegated_access.sod_exceptions: rule_id no existe o no es de la organizacion del contexto',
      ),
    ) as ResourceNotFoundException;
    expect(e.getStatus()).toBe(404);
    expect(e.message).not.toMatch(/rls|organizacion/i);
  });

  it('23001 sobre la bitácora WORM ⇒ 409 APPEND_ONLY', () => {
    const e = mapGovernanceDbError(
      pg(
        '23001',
        undefined,
        'append-only/immutable: UPDATE no permitido en delegated_access.access_decision_log',
      ),
    ) as ConflictException;
    expect(e.getStatus()).toBe(409);
    expect(e.reason).toBe('APPEND_ONLY');
  });

  it('lo que no es de estas tablas, o no tiene razón propia, lo deja al filtro global', () => {
    expect(mapGovernanceDbError(pg('23514', 'ck_otra_cosa'))).toBeUndefined();
    expect(mapGovernanceDbError(pg('23505', 'uq_otra_tabla'))).toBeUndefined();
    expect(
      mapGovernanceDbError(pg('23503', undefined, 'public.otra: fk')),
    ).toBeUndefined();
    expect(
      mapGovernanceDbError(pg('23001', undefined, 'otra tabla')),
    ).toBeUndefined();
    expect(mapGovernanceDbError(pg('40001'))).toBeUndefined();
    expect(mapGovernanceDbError(new Error('boom'))).toBeUndefined();
  });
});
