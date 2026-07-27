import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo geo (prefijo `geo:`).
 *
 * Cubren los estados/tipos que los endpoints de geolocalización necesitan y que
 * NO existen en el catálogo transversal (`CONCEPTS.*`): tipo de sujeto rastreado,
 * ciclo de vida de sesiones/viajes, forma y estado de geofences, y tipo de evento
 * de geofence. Cada columna `*_concept_id` NOT NULL de los inserts de este módulo
 * recibe uno de estos ids o un `CONCEPTS.*` transversal.
 *
 * `GEO_CONCEPT_SEEDS` lo consume el agregador central del seed; `GEO` es el mapa
 * `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: GEO_CONCEPT_SEEDS, ids: GEO } = defineModuleConcepts(
  'geo',
  {
    // --- Tipo de sujeto rastreado (tracked_subjects.subject_type_concept_id) ---
    SUBJECT_TYPE_PERSON: {
      code: 'GEO_SUBJECT_TYPE_PERSON',
      display: 'Tracked person',
    },
    SUBJECT_TYPE_VEHICLE: {
      code: 'GEO_SUBJECT_TYPE_VEHICLE',
      display: 'Tracked vehicle',
    },

    // --- Estado del sujeto rastreado (tracked_subjects.state_concept_id) ---
    SUBJECT_ACTIVE: {
      code: 'GEO_SUBJECT_ACTIVE',
      display: 'Tracked subject active',
    },
    SUBJECT_SUSPENDED: {
      code: 'GEO_SUBJECT_SUSPENDED',
      display: 'Tracked subject suspended',
    },

    // --- Estado de la sesión de tracking (tracking_sessions.status_concept_id) ---
    SESSION_OPEN: {
      code: 'GEO_SESSION_OPEN',
      display: 'Tracking session open',
    },
    SESSION_CLOSED: {
      code: 'GEO_SESSION_CLOSED',
      display: 'Tracking session closed',
    },

    // --- Propósito de la sesión (tracking_sessions.purpose_concept_id) ---
    SESSION_PURPOSE_DISPATCH: {
      code: 'GEO_SESSION_PURPOSE_DISPATCH',
      display: 'Dispatch tracking',
    },

    // --- Forma del geofence (geofences.shape_type_concept_id) ---
    SHAPE_CIRCLE: { code: 'GEO_SHAPE_CIRCLE', display: 'Circular geofence' },
    SHAPE_POLYGON: { code: 'GEO_SHAPE_POLYGON', display: 'Polygonal geofence' },

    // --- Estado del geofence (geofences.state_concept_id) ---
    GEOFENCE_ACTIVE: {
      code: 'GEO_GEOFENCE_ACTIVE',
      display: 'Geofence active',
    },

    // --- Tipo de evento de geofence (geofence_events.event_type_concept_id) ---
    EVENT_ENTER: { code: 'GEO_EVENT_ENTER', display: 'Geofence enter' },
    EVENT_EXIT: { code: 'GEO_EVENT_EXIT', display: 'Geofence exit' },

    // --- Estado del viaje (trips.status_concept_id) ---
    TRIP_IN_PROGRESS: {
      code: 'GEO_TRIP_IN_PROGRESS',
      display: 'Trip in progress',
    },
    TRIP_COMPLETED: { code: 'GEO_TRIP_COMPLETED', display: 'Trip completed' },

    // --- Red del ping de ubicación (location_pings.network_concept_id) ---
    NETWORK_CELLULAR: {
      code: 'GEO_NETWORK_CELLULAR',
      display: 'Cellular network',
    },
    NETWORK_WIFI: { code: 'GEO_NETWORK_WIFI', display: 'Wi-Fi network' },
  },
);

/** Mapea el código de tipo de sujeto (DTO) a su concept id. */
export const SUBJECT_TYPE_CONCEPT_BY_CODE: Record<
  'PERSON' | 'VEHICLE',
  string
> = {
  PERSON: GEO.SUBJECT_TYPE_PERSON,
  VEHICLE: GEO.SUBJECT_TYPE_VEHICLE,
};

/** Mapea el código de forma del geofence (DTO) a su concept id. */
export const SHAPE_TYPE_CONCEPT_BY_CODE: Record<'CIRCLE' | 'POLYGON', string> =
  {
    CIRCLE: GEO.SHAPE_CIRCLE,
    POLYGON: GEO.SHAPE_POLYGON,
  };

/** Mapea el código de tipo de evento de geofence (DTO) a su concept id. */
export const EVENT_TYPE_CONCEPT_BY_CODE: Record<'ENTER' | 'EXIT', string> = {
  ENTER: GEO.EVENT_ENTER,
  EXIT: GEO.EVENT_EXIT,
};

/** Mapea el código de red del ping (DTO) a su concept id. */
export const NETWORK_CONCEPT_BY_CODE: Record<'CELLULAR' | 'WIFI', string> = {
  CELLULAR: GEO.NETWORK_CELLULAR,
  WIFI: GEO.NETWORK_WIFI,
};
