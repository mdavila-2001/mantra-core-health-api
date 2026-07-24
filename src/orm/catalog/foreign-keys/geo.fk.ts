import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `geo`.
 * 31 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const geoForeignKeys: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['geofence_events', 'event_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['geofence_events', 'geofence_id', 'geo', 'geofences', 'id'],
  ['geofence_events', 'location_ping_id', 'geo', 'location_pings', 'id'],
  ['geofence_events', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['geofence_events', 'tracked_subject_id', 'geo', 'tracked_subjects', 'id'],
  ['geofences', 'created_by_user_id', 'iam', 'users', 'id'],
  ['geofences', 'shape_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['geofences', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['geofences', 'tenant_id', 'directory', 'tenants', 'id'],
  ['geofences', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['location_pings', 'device_id', 'iam', 'devices', 'id'],
  ['location_pings', 'network_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['location_pings', 'recorded_by_user_id', 'iam', 'users', 'id'],
  ['location_pings', 'tracked_subject_id', 'geo', 'tracked_subjects', 'id'],
  ['tracked_subjects', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tracked_subjects', 'device_id', 'iam', 'devices', 'id'],
  ['tracked_subjects', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracked_subjects', 'subject_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracked_subjects', 'tenant_id', 'directory', 'tenants', 'id'],
  ['tracked_subjects', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tracking_sessions', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tracking_sessions', 'purpose_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracking_sessions', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracking_sessions', 'tracked_subject_id', 'geo', 'tracked_subjects', 'id'],
  ['tracking_sessions', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['trips', 'created_by_user_id', 'iam', 'users', 'id'],
  ['trips', 'destination_address_id', 'common', 'addresses', 'id'],
  ['trips', 'origin_address_id', 'common', 'addresses', 'id'],
  ['trips', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['trips', 'tracking_session_id', 'geo', 'tracking_sessions', 'id'],
  ['trips', 'updated_by_user_id', 'iam', 'users', 'id'],
];
