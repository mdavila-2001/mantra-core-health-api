import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `procedures_perioperative` (parte 2/2).
 * 7 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const proceduresPerioperativeForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['surgical_safety_items', 'response_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_items', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['surgical_safety_responses', 'response_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_responses', 'response_status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['surgical_safety_responses', 'surgical_safety_checklist_id', 'procedures_perioperative', 'surgical_safety_checklists', 'id'],
  ['surgical_safety_responses', 'surgical_safety_item_id', 'procedures_perioperative', 'surgical_safety_items', 'id'],
];
