/* ============================================================================
    Which web route a push notification opens when tapped.

    Mirrors the front's `core/notifications/notification-routes.ts`
    (`rutaDeNotificacion`). The bell resolves `(type, id)` on the client; a push
    is opened by the service worker (or the native shell) before Angular has
    loaded anything, so the API has to send the final path. Keep both tables in
    sync: a type the front learns to open should be added here too.
    ========================================================================== */

/** Internal app route: plain segments, optional simple query; no scheme, no `//`. */
const INTERNAL_ROUTE =
  /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?(?:\?[A-Za-z0-9_=&%.-]*)?$/;

/**
 * Where a push lands when nothing more specific is known: the notification
 * center. Not `/notifications`, which is the API proxy prefix on the same
 * origin and answers with API JSON / NotFound.
 */
export const DEFAULT_PUSH_ROUTE = '/notification-center';

/** `route` if it is a safe internal route, otherwise `undefined`. */
export function safeRoute(route: string | undefined): string | undefined {
  return route !== undefined && INTERNAL_ROUTE.test(route) ? route : undefined;
}

/**
 * Same table as the front (`RUTAS`), plus types whose screen exists in the
 * front router. Unknown types fall back to the notification center.
 */
const ROUTES: Readonly<Record<string, (id: string) => string>> = {
  PRESCRIPTION: () => '/my-account/medical-record',
  // Contract: opens the same screen as PRESCRIPTION.
  PRESCRIPTION_EXPIRING: () => '/my-account/medical-record',
  ENCOUNTER: () => '/my-account/medical-record',
  DIAGNOSTIC_REPORT: () => '/my-account/diagnostic-results',
  APPOINTMENT: () => '/my-account/appointments',
  PHARMACY_ORDER: (id) => `/my-account/pharmacy-orders/${id}`,
  PHARMACY_RECEIPT: (id) => `/my-account/pharmacy-orders/${id}/receipt`,
  CONVERSATION: (id) => `/messaging/${id}?responder=1`,
  CARE_RELATIONSHIP_REQUEST: () => '/my-account/requests?pestana=vinculos',
  DEPENDENT_LINK_REQUEST: () => '/my-account/dependents',
  'scheduling.appointment_bookings': () => '/my-account/appointments',
  'scheduling.bookable_slots': () => '/my-account/appointments',
  SERVICE_REQUEST: () => '/my-account/diagnostic-orders',
  PRACTITIONER_PROFILE: (id) => `/directory/${id}`,
  // Added with API-MODULES' destination types; each path checked against the
  // front router (navigation.map.ts / routes/*.ts) on 2026-11-06.
  PHARMA_LAB_DOCTOR_VISITS: () => '/lab-visits',
  PHARMA_LAB_VISITOR_VISITS: () => '/my-visits',
  PHARMA_LAB_ADMIN: () => '/administration/pharma-lab',
  CRITICAL_RESULT: () => '/diagnostics',
  PROCEDURE_CASE: (id) => `/interventions/${id}`,
  'community.groups': (id) => `/groups/${id}`,
};

/** A notification target as stored in `related_resource_type/id`. */
export interface PushDestination {
  readonly type: string;
  readonly id: string;
}

/**
 * The route a push opens.
 *
 * 1. An explicit `payload.route` set by the emitting module wins, if safe
 *    (e.g. `/account/profile` for admission notices, `/o/{slug}` for an
 *    organization referral).
 * 2. Otherwise the destination type is mapped like the front does.
 * 3. Anything unknown or unsafe falls back to the notification center, which
 *    always exists and lists the notice.
 */
export function resolvePushRoute(
  destination?: PushDestination | null,
  explicitRoute?: string,
): string {
  const explicit = safeRoute(explicitRoute);
  if (explicit) return explicit;
  if (!destination) return DEFAULT_PUSH_ROUTE;
  // ORGANIZATION_PROFILE has no entry: its `/o/{slug}` route always comes as
  // the explicit payload route, handled above.
  const build = ROUTES[destination.type];
  return (build && safeRoute(build(destination.id))) ?? DEFAULT_PUSH_ROUTE;
}

/** `payload.route` if the payload carries a string one. */
export function routeFromPayload(payload: unknown): string | undefined {
  const route = (payload as { route?: unknown } | null | undefined)?.route;
  return typeof route === 'string' ? route : undefined;
}
