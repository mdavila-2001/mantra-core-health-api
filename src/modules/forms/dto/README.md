# Forms — DTOs

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los DTOs de entrada
validan tipos, requeridos, longitudes, enums y uuids; los de respuesta exponen solo
campos seguros. El pipe global es `whitelist + forbidNonWhitelisted`, por lo que
todo campo debe llevar un decorador (los valores polimórficos `value` usan `@Allow()`).

| Archivo | DTOs |
|---------|------|
| `create-definition-set.dto.ts` | `CreateDefinitionSetDto` |
| `publish-version.dto.ts` | `PublishVersionDto`, `SetMemberInputDto` |
| `create-field-definition.dto.ts` | `CreateFieldDefinitionDto`, `ValidationRuleInputDto`, `TECHNICAL_DATA_TYPES` |
| `create-field-dependency.dto.ts` | `CreateFieldDependencyDto` |
| `upsert-localization.dto.ts` | `UpsertLocalizationDto` |
| `create-access-rule.dto.ts` | `CreateAccessRuleDto` |
| `create-assignment.dto.ts` | `CreateAssignmentDto` |
| `open-instance.dto.ts` | `OpenInstanceDto` |
| `capture-values.dto.ts` | `CaptureValuesDto`, `FieldValueInputDto` |
| `correct-value.dto.ts` | `CorrectValueDto` |
| `import-values.dto.ts` | `ImportValuesDto`, `ImportValueItemDto` |
| `run-migration.dto.ts` | `RunMigrationDto` |
| `responses.dto.ts` | `IdResponseDto`, `IdListResponseDto`, `OkResultDto`, `DefinitionSetResponseDto`, `FormInstanceResponseDto`, `MigrationRunResponseDto` |
