import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `medical_groups`.
 * 10 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const medicalGroupsIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['groups', 'ix_medical_groups_groups_tenant_id', ['tenant_id'], false, 'btree'],
  ['groups', 'ix_medical_groups_groups_requesting_practitioner_id', ['requesting_practitioner_id'], false, 'btree'],
  ['groups', 'ix_medical_groups_groups_patient_profile_id', ['patient_profile_id'], false, 'btree'],
  ['groups', 'ix_medical_groups_groups_service_catalog_id', ['service_catalog_id'], false, 'btree'],
  ['groups', 'ix_medical_groups_groups_status', ['status'], false, 'btree'],
  ['groups', 'ix_medical_groups_groups_scheduled_at', ['scheduled_at'], false, 'btree'],
  ['group_members', 'ix_medical_groups_group_members_group_id', ['group_id'], false, 'btree'],
  ['group_members', 'ix_medical_groups_group_members_practitioner_profile_id', ['practitioner_profile_id'], false, 'btree'],
  ['group_members', 'ix_medical_groups_group_members_invitation_status', ['invitation_status'], false, 'btree'],
  ['group_members', 'ux_medical_groups_group_members_group_practitioner', ['group_id', 'practitioner_profile_id'], true, 'btree'],
];
