import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `geo`.
 * 35 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const geoIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['geofences', 'ix_geofences_tenant_id', ['tenant_id'], false, 'btree'],
  ['geofences', 'ix_geofences_shape_type_concept_id', ['shape_type_concept_id'], false, 'btree'],
  ['geofences', 'ix_geofences_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['geofences', 'ix_geofences_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['geofences', 'ix_geofences_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['geofences', 'ix_geofences_tenant_id_state_concept_id', ['tenant_id', 'state_concept_id', 'updated_at desc'], false, 'btree'],
  ['geofence_events', 'ix_geofence_events_geofence_id', ['geofence_id'], false, 'btree'],
  ['geofence_events', 'ix_geofence_events_tracked_subject_id', ['tracked_subject_id'], false, 'btree'],
  ['geofence_events', 'ix_geofence_events_event_type_concept_id', ['event_type_concept_id'], false, 'btree'],
  ['geofence_events', 'ix_geofence_events_location_ping_id', ['location_ping_id'], false, 'btree'],
  ['geofence_events', 'ix_geofence_events_recorded_by_user_id', ['recorded_by_user_id'], false, 'btree'],
  ['geofence_events', 'brin_geofence_events_recorded_at', ['recorded_at'], false, 'brin'],
  ['location_pings', 'ix_location_pings_tracked_subject_id', ['tracked_subject_id'], false, 'btree'],
  ['location_pings', 'ix_location_pings_device_id', ['device_id'], false, 'btree'],
  ['location_pings', 'ix_location_pings_network_concept_id', ['network_concept_id'], false, 'btree'],
  ['location_pings', 'ix_location_pings_recorded_by_user_id', ['recorded_by_user_id'], false, 'btree'],
  ['location_pings', 'brin_location_pings_recorded_at', ['recorded_at'], false, 'brin'],
  ['tracked_subjects', 'ix_tracked_subjects_subject_type_concept_id', ['subject_type_concept_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_device_id', ['device_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_tenant_id', ['tenant_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['tracked_subjects', 'ix_tracked_subjects_tenant_id_state_concept_id', ['tenant_id', 'state_concept_id', 'updated_at desc'], false, 'btree'],
  ['tracking_sessions', 'ix_tracking_sessions_tracked_subject_id', ['tracked_subject_id'], false, 'btree'],
  ['tracking_sessions', 'ix_tracking_sessions_purpose_concept_id', ['purpose_concept_id'], false, 'btree'],
  ['tracking_sessions', 'ix_tracking_sessions_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['tracking_sessions', 'ix_tracking_sessions_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tracking_sessions', 'ix_tracking_sessions_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['trips', 'ix_trips_tracking_session_id', ['tracking_session_id'], false, 'btree'],
  ['trips', 'ix_trips_origin_address_id', ['origin_address_id'], false, 'btree'],
  ['trips', 'ix_trips_destination_address_id', ['destination_address_id'], false, 'btree'],
  ['trips', 'ix_trips_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['trips', 'ix_trips_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['trips', 'ix_trips_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
