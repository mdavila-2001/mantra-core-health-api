import {
  DEFAULT_PUSH_ROUTE,
  resolvePushRoute,
  routeFromPayload,
  safeRoute,
} from './push-route';

describe('resolvePushRoute', () => {
  it('defaults to the notification center, never the /notifications API prefix', () => {
    expect(DEFAULT_PUSH_ROUTE).toBe('/notification-center');
    expect(resolvePushRoute()).toBe('/notification-center');
    expect(resolvePushRoute(null, undefined)).toBe('/notification-center');
  });

  it.each([
    ['PRESCRIPTION', 'rx-1', '/my-account/medical-record'],
    ['PRESCRIPTION_EXPIRING', 'rx-1', '/my-account/medical-record'],
    ['ENCOUNTER', 'e-1', '/my-account/medical-record'],
    ['DIAGNOSTIC_REPORT', 'd-1', '/my-account/diagnostic-results'],
    ['APPOINTMENT', 'a-1', '/my-account/appointments'],
    ['PHARMACY_ORDER', 'o-1', '/my-account/pharmacy-orders/o-1'],
    ['PHARMACY_RECEIPT', 'o-1', '/my-account/pharmacy-orders/o-1/receipt'],
    ['CONVERSATION', 'c-1', '/messaging/c-1?responder=1'],
    [
      'CARE_RELATIONSHIP_REQUEST',
      'r-1',
      '/my-account/requests?pestana=vinculos',
    ],
    ['DEPENDENT_LINK_REQUEST', 'l-1', '/my-account/dependents'],
    ['scheduling.appointment_bookings', 'b-1', '/my-account/appointments'],
    ['scheduling.bookable_slots', 's-1', '/my-account/appointments'],
    ['SERVICE_REQUEST', 's-1', '/my-account/diagnostic-orders'],
    ['PRACTITIONER_PROFILE', 'p-1', '/directory/p-1'],
    ['PHARMA_LAB_DOCTOR_VISITS', 'v-1', '/lab-visits'],
    ['PHARMA_LAB_VISITOR_VISITS', 'v-1', '/my-visits'],
    ['PHARMA_LAB_ADMIN', 'x-1', '/administration/pharma-lab'],
    ['CRITICAL_RESULT', 'r-1', '/diagnostics'],
    ['PROCEDURE_CASE', 'case-1', '/interventions/case-1'],
    ['community.groups', 'g-1', '/groups/g-1'],
  ])('maps %s like the front does', (type, id, route) => {
    expect(resolvePushRoute({ type, id })).toBe(route);
  });

  it('falls back to the notification center for types the front cannot open', () => {
    expect(resolvePushRoute({ type: 'POST', id: 'p-1' })).toBe(
      DEFAULT_PUSH_ROUTE,
    );
    expect(resolvePushRoute({ type: 'INSURANCE_CLAIM', id: 'x' })).toBe(
      DEFAULT_PUSH_ROUTE,
    );
    expect(resolvePushRoute({ type: 'ORGANIZATION_PROFILE', id: 't' })).toBe(
      DEFAULT_PUSH_ROUTE,
    );
  });

  it('an explicit safe payload route wins over the destination mapping', () => {
    expect(
      resolvePushRoute(
        { type: 'profiles.practitioner_admissions', id: 'a' },
        '/account/profile',
      ),
    ).toBe('/account/profile');
    expect(
      resolvePushRoute(
        { type: 'ORGANIZATION_PROFILE', id: 't' },
        '/o/clinica-sur',
      ),
    ).toBe('/o/clinica-sur');
  });

  it('ignores unsafe explicit routes and ids that would build an unsafe path', () => {
    expect(
      resolvePushRoute({ type: 'CONVERSATION', id: 'c-1' }, '//evil.example'),
    ).toBe('/messaging/c-1?responder=1');
    expect(resolvePushRoute(null, 'https://evil.example/x')).toBe(
      DEFAULT_PUSH_ROUTE,
    );
    expect(resolvePushRoute({ type: 'PHARMACY_ORDER', id: '../x' })).toBe(
      DEFAULT_PUSH_ROUTE,
    );
  });
});

describe('safeRoute / routeFromPayload', () => {
  it('accepts internal paths only', () => {
    expect(safeRoute('/account/profile')).toBe('/account/profile');
    expect(safeRoute('//evil.example')).toBeUndefined();
    expect(safeRoute('javascript:alert(1)')).toBeUndefined();
    expect(safeRoute(undefined)).toBeUndefined();
  });

  it('reads payload.route only when it is a string', () => {
    expect(routeFromPayload({ route: '/x' })).toBe('/x');
    expect(routeFromPayload({ route: 3 })).toBeUndefined();
    expect(routeFromPayload(null)).toBeUndefined();
  });
});
