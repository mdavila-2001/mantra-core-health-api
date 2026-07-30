import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { FORMS } from '../../../src/modules/forms/forms.concepts';

/**
 * Smoke del módulo Forms (09). Encadena el ciclo completo de extensibilidad sobre
 * `ctx.vars`:
 *  - set de definiciones + versión inicial (UC-09-01) → publicación (UC-09-03);
 *  - definición de campo con reglas (UC-09-02) → dependencia (UC-09-04) →
 *    localización (UC-09-05) → regla de acceso (UC-09-12);
 *  - asignación gobernada (UC-09-06);
 *  - instancia (UC-09-07) → captura (UC-09-08) → corrección (UC-09-09) →
 *    importación (UC-09-10) → cierre (UC-09-11);
 *  - migración de esquema (UC-09-13).
 *
 * `ctx.adminUserId` es un usuario real (FK created_by válida). Los recursos
 * cross-módulo se reciben por DTO; para `resource_id` se usa
 * `ctx.vars.patientProfileId` si un módulo previo lo pobló, o el propio admin.
 */
export const FORMS_SMOKE: SmokeCase[] = [
  // --- UC-09-01: crear set + versión inicial ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets',
    name: 'happy: crea set y versión draft',
    method: 'post',
    path: () => '/forms/definition-sets',
    body: (c) => ({
      namespaceUri: `urn:forms:${c.u}`,
      code: `FS-${c.u}`,
      name: 'Ficha ampliada',
      ownerTenantId: c.tenantId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsSetId = String(b.id);
      c.vars.formsVersionId = String(b.versionId);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/forms/definition-sets',
    auth: false,
    body: (c) => ({ namespaceUri: `urn:x:${c.u}`, code: 'X', name: 'X' }),
    expectedStatus: 401,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets',
    name: 'límite: falta name -> 400',
    method: 'post',
    path: () => '/forms/definition-sets',
    body: (c) => ({ namespaceUri: `urn:y:${c.u}`, code: 'Y' }),
    expectedStatus: 400,
  },

  // --- UC-09-02: declarar campo con reglas ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/field-definitions',
    name: 'happy: declara campo string con regla required',
    method: 'post',
    path: () => '/forms/field-definitions',
    body: (c) => ({
      code: `field-${c.u}`,
      name: 'Alergias',
      dataType: 'string',
      validationRules: [
        {
          ruleType: 'REQUIRED',
          parameters: { required: true },
          severity: 'ERROR',
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsFieldId = String(b.id);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/field-definitions',
    name: 'happy: declara segundo campo (fuente de dependencia)',
    method: 'post',
    path: () => '/forms/field-definitions',
    body: (c) => ({
      code: `field2-${c.u}`,
      name: 'Tiene alergias',
      dataType: 'boolean',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsSourceFieldId = String(b.id);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/field-definitions',
    name: 'límite: dataType inválido -> 400',
    method: 'post',
    path: () => '/forms/field-definitions',
    body: (c) => ({ code: `bad-${c.u}`, name: 'X', dataType: 'nope' }),
    expectedStatus: 400,
  },

  // --- UC-09-03: publicar versión con miembros ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets/{id}/versions/{ver}/publish',
    name: 'happy: publica versión con un miembro',
    method: 'post',
    path: (c) =>
      `/forms/definition-sets/${c.vars.formsSetId}/versions/${c.vars.formsVersionId}/publish`,
    body: (c) => ({
      members: [{ fieldId: c.vars.formsFieldId, required: true, ordinal: 0 }],
    }),
    expectedStatus: 200,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets/{id}/versions/{ver}/publish',
    name: 'límite: versión ya publicada -> 422',
    method: 'post',
    path: (c) =>
      `/forms/definition-sets/${c.vars.formsSetId}/versions/${c.vars.formsVersionId}/publish`,
    body: (c) => ({ members: [{ fieldId: c.vars.formsFieldId }] }),
    expectedStatus: 422,
  },

  // --- UC-09-04: dependencia condicional ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/fields/{id}/dependencies',
    name: 'happy: define dependencia SHOW',
    method: 'post',
    path: (c) => `/forms/fields/${c.vars.formsFieldId}/dependencies`,
    body: (c) => ({
      sourceFieldId: c.vars.formsSourceFieldId,
      operator: 'EQ',
      behavior: 'SHOW',
      comparisonValue: true,
      logicalGroup: 'g1',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/fields/{id}/dependencies',
    name: 'límite: campo fuente inexistente -> 404',
    method: 'post',
    path: (c) => `/forms/fields/${c.vars.formsFieldId}/dependencies`,
    body: () => ({
      sourceFieldId: UUID_ABSENT,
      operator: 'EQ',
      behavior: 'SHOW',
    }),
    expectedStatus: 404,
  },

  // --- UC-09-05: localización i18n ---
  {
    module: 'Forms',
    endpoint: 'PUT /forms/fields/{id}/localizations/{lang}',
    name: 'happy: localiza en español',
    method: 'put',
    path: (c) => `/forms/fields/${c.vars.formsFieldId}/localizations/es`,
    body: () => ({ label: 'Alergias', helpText: 'Liste alergias conocidas' }),
    expectedStatus: 200,
  },
  {
    module: 'Forms',
    endpoint: 'PUT /forms/fields/{id}/localizations/{lang}',
    name: 'límite: campo inexistente -> 404',
    method: 'put',
    path: () => `/forms/fields/${UUID_ABSENT}/localizations/es`,
    body: () => ({ label: 'x' }),
    expectedStatus: 404,
  },

  // --- UC-09-12: regla de acceso / enmascarado ---
  // Prep cross-módulo: crea un value set real (FK purpose_of_use_value_set_id).
  {
    module: 'Forms',
    endpoint: 'POST /terminology/value-sets',
    name: 'prep: value set para propósito de uso',
    method: 'post',
    path: () => '/terminology/value-sets',
    body: (c) => ({
      internalCode: `forms-pou-${c.u}`,
      name: 'Purpose of use',
      canonicalUrl: `http://x/forms/pou/${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsValueSetId = String(b.id);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/fields/{id}/access-rules',
    name: 'happy: define regla de enmascarado',
    method: 'post',
    path: (c) => `/forms/fields/${c.vars.formsFieldId}/access-rules`,
    body: (c) => ({
      purposeOfUseValueSetId: c.vars.formsValueSetId,
      maskStrategy: 'REDACT',
      breakGlassAllowed: true,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/fields/{id}/access-rules',
    name: 'límite: campo inexistente -> 404',
    method: 'post',
    path: (c) => `/forms/fields/${UUID_ABSENT}/access-rules`,
    body: (c) => ({ purposeOfUseValueSetId: c.vars.formsValueSetId }),
    expectedStatus: 404,
  },

  // --- UC-09-06: asignación gobernada ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/assignments',
    name: 'happy: asigna campo al target (sección auto)',
    method: 'post',
    path: () => '/forms/assignments',
    body: (c) => ({
      fieldId: c.vars.formsFieldId,
      targetResourceConceptId: FORMS.RESOURCE_TYPE_PATIENT,
      required: false,
      visible: true,
      editable: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsAssignmentId = String(b.id);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/assignments',
    name: 'límite: campo inexistente -> 404',
    method: 'post',
    path: (c) => '/forms/assignments',
    body: () => ({
      fieldId: UUID_ABSENT,
      targetResourceConceptId: FORMS.RESOURCE_TYPE_PATIENT,
    }),
    expectedStatus: 404,
  },

  // --- UC-09-07: abrir instancia ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances',
    name: 'happy: abre instancia para el recurso',
    method: 'post',
    path: () => '/forms/instances',
    body: (c) => ({
      resourceId: c.vars.patientProfileId ?? c.adminUserId,
      schemaVersion: 1,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsInstanceId = String(b.id);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances',
    name: 'límite: falta resourceId -> 400',
    method: 'post',
    path: () => '/forms/instances',
    body: () => ({ schemaVersion: 1 }),
    expectedStatus: 400,
  },

  // --- UC-09-08: capturar valores ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances/{id}/values',
    name: 'happy: captura un valor string',
    method: 'post',
    path: (c) => `/forms/instances/${c.vars.formsInstanceId}/values`,
    body: (c) => ({
      values: [
        {
          fieldId: c.vars.formsFieldId,
          dataType: 'string',
          value: 'Penicilina',
          assignmentId: c.vars.formsAssignmentId,
          ordinal: 0,
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.formsValueId = String((b.ids as string[])[0]);
    },
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances/{id}/values',
    name: 'límite: instancia inexistente -> 404',
    method: 'post',
    path: (c) => `/forms/instances/${UUID_ABSENT}/values`,
    body: (c) => ({
      values: [
        { fieldId: c.vars.formsFieldId, dataType: 'string', value: 'x' },
      ],
    }),
    expectedStatus: 404,
  },

  // --- UC-09-09: corregir valor ---
  {
    module: 'Forms',
    endpoint: 'PATCH /forms/values/{id}',
    name: 'happy: corrige el valor (supersede)',
    method: 'patch',
    path: (c) => `/forms/values/${c.vars.formsValueId}`,
    body: () => ({ dataType: 'string', value: 'Amoxicilina' }),
    expectedStatus: 200,
  },
  {
    module: 'Forms',
    endpoint: 'PATCH /forms/values/{id}',
    name: 'límite: valor inexistente -> 404',
    method: 'patch',
    path: () => `/forms/values/${UUID_ABSENT}`,
    body: () => ({ dataType: 'string', value: 'x' }),
    expectedStatus: 404,
  },

  // --- UC-09-10: importar valores (ETL) ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/values/import',
    name: 'happy: importa un valor externo',
    method: 'post',
    path: () => '/forms/values/import',
    body: (c) => ({
      importBatchId: c.adminUserId,
      items: [
        {
          formInstanceId: c.vars.formsInstanceId,
          fieldId: c.vars.formsFieldId,
          dataType: 'string',
          value: 'Importado',
          sourceSystemUri: 'urn:etl:legacy',
          contentHash: `h-${c.u}`,
        },
      ],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/values/import',
    name: 'límite: items vacío -> 400',
    method: 'post',
    path: (c) => '/forms/values/import',
    body: (c) => ({ importBatchId: c.adminUserId, items: [] }),
    expectedStatus: 400,
  },

  // --- UC-09-11: cerrar instancia ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances/{id}/close',
    name: 'happy: cierra la instancia',
    method: 'post',
    path: (c) => `/forms/instances/${c.vars.formsInstanceId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/instances/{id}/close',
    name: 'límite: instancia ya cerrada -> 422',
    method: 'post',
    path: (c) => `/forms/instances/${c.vars.formsInstanceId}/close`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- UC-09-13: migrar esquema ---
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets/{id}/migrations/{migrationId}/run',
    name: 'happy: ejecuta migración (no-op entre misma versión)',
    method: 'post',
    path: (c) =>
      `/forms/definition-sets/${c.vars.formsSetId}/migrations/${c.vars.formsInstanceId}/run`,
    body: (c) => ({
      fromVersionId: c.vars.formsVersionId,
      toVersionId: c.vars.formsVersionId,
    }),
    expectedStatus: 200,
  },
  {
    module: 'Forms',
    endpoint: 'POST /forms/definition-sets/{id}/migrations/{migrationId}/run',
    name: 'límite: set inexistente -> 404',
    method: 'post',
    path: (c) =>
      `/forms/definition-sets/${UUID_ABSENT}/migrations/${c.vars.formsSetId}/run`,
    body: (c) => ({
      fromVersionId: c.vars.formsVersionId,
      toVersionId: c.vars.formsVersionId,
    }),
    expectedStatus: 404,
  },
];
