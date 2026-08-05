# Forms — Repositories

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la unidad de trabajo y la transacción. No
contienen reglas de negocio; solo construcción de consultas y `em.create`
(`{ partial: true }`, con auditoría vía `createdBy`).

| Repositorio | Entidades | Métodos clave |
|-------------|-----------|---------------|
| `definition-sets.repository.ts` | `FieldDefinitionSets`, `FieldDefinitionSetVersions`, `FieldSetMembers` | `findSetById/ByNamespace`, `createSet`, `findVersionById`, `createVersion`, `createMember` |
| `field-definitions.repository.ts` | `DynamicFieldDefinitions`, `FieldValidationRules`, `FieldDependencies`, `FieldDefinitionLocalizations`, `FieldValueAccessRules` | `findFieldById/ByCode`, `createField`, `createValidationRule`, `findDependency`, `createDependency`, `findLocalization`, `createLocalization`, `createAccessRule` |
| `assignments.repository.ts` | `FieldAssignments`, `ExtensionTargetPolicies`, `DynamicFieldSections` | `findActivePolicy`, `countActiveAssignments`, `createSection`, `createAssignment` |
| `form-instances.repository.ts` | `FormInstances` | `findById`, `findByResourceAndVersion`, `create` |
| `field-values.repository.ts` | `FieldValues`, `FieldValueAudit`, `FieldValueProvenance` | `findById`, `findPreliminaryByInstance`, `create`, `createAudit`, `createProvenance` |
| `migrations.repository.ts` | `FieldSchemaMigrations` | `findById`, `create` |
