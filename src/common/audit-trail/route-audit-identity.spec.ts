import {
  deriveRouteAuditIdentity,
  isUuid,
  joinRouteTemplate,
  toInetAddress,
} from './route-audit-identity';

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('route-audit-identity', () => {
  it('une controlador y handler en una plantilla canónica', () => {
    expect(joinRouteTemplate('clinical/', '/observations/:id/amend')).toBe(
      '/clinical/observations/:id/amend',
    );
    expect(joinRouteTemplate('', '')).toBe('/');
  });

  it('acepta sólo UUID como id (entity_id es uuid)', () => {
    expect(isUuid(A)).toBe(true);
    expect(isUuid('42')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('acepta sólo direcciones IP para la columna inet', () => {
    expect(toInetAddress('::ffff:10.0.0.1')).toBe('::ffff:10.0.0.1');
    expect(toInetAddress(' 192.168.0.4 ')).toBe('192.168.0.4');
    expect(toInetAddress('proxy.local')).toBeUndefined();
    expect(toInetAddress(undefined)).toBeUndefined();
  });

  it('deriva acción, entidad e id de `:id`', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'patch',
        routeTemplate: '/clinical/observations/:id/amend',
        params: { id: A },
      }),
    ).toEqual({
      action: 'HTTP PATCH /clinical/observations/:id/amend',
      entity: 'observations',
      entityId: A,
    });
  });

  it('sin `:id`, toma el ÚLTIMO parámetro UUID como recurso tocado', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/patients/:patientId/care-plans/:planId/activities',
        params: { patientId: A, planId: B },
      }),
    ).toMatchObject({ entity: 'care_plans', entityId: B });
  });

  it('un parámetro que no es UUID no se sella como id', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/internal/queues/:code/claim',
        params: { code: 'EMAIL' },
      }),
    ).toEqual({
      action: 'HTTP POST /internal/queues/:code/claim',
      entity: 'claim',
      entityId: undefined,
    });
  });

  it('en un alta sin parámetros el id sale de la respuesta', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/clinical/allergy-intolerances',
        params: {},
        result: { id: A },
      }),
    ).toMatchObject({ entity: 'allergy_intolerances', entityId: A });
  });

  it('el nombre de negocio de @Audited manda sobre lo derivado', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/delegated-permission-sets/:id/versions',
        params: { id: A },
        result: { id: B },
        options: {
          action: 'PERMISSION_SET_VERSION_PUBLISHED',
          entity: 'delegated_permission_set_version',
          entityId: 'result.id',
        },
      }),
    ).toEqual({
      action: 'PERMISSION_SET_VERSION_PUBLISHED',
      entity: 'delegated_permission_set_version',
      entityId: B,
    });
  });

  it('con body.<campo> el id sale del cuerpo de la petición', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/consent/consent-evidence',
        params: {},
        result: { recorded: true },
        body: { consentId: A },
        options: {
          action: 'CONSENT_EVIDENCE_RECORDED',
          entity: 'consent_evidence',
          entityId: 'body.consentId',
        },
      }),
    ).toMatchObject({ entityId: A });
  });

  it('un id del cuerpo que no es UUID no se sella', () => {
    expect(
      deriveRouteAuditIdentity({
        method: 'POST',
        routeTemplate: '/consent/consent-evidence',
        params: {},
        body: { consentId: 'not-a-uuid' },
        options: {
          action: 'CONSENT_EVIDENCE_RECORDED',
          entity: 'consent_evidence',
          entityId: 'body.consentId',
        },
      }),
    ).toMatchObject({ entityId: undefined });
  });
});
