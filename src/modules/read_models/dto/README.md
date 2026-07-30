# read_models · dto

DTOs de entrada (`class-validator` + `@nestjs/swagger`) y de salida (solo campos
seguros). Las colecciones anidadas del contrato de vista usan `@ValidateNested` +
`@Type` para validar cada elemento del allow-list.

| DTO | Uso |
| --- | --- |
| `CreateReadModelDefinitionDto` / `ReadModelDependencyInputDto` | UC-30-01 crear/publicar contrato |
| `CreateReadModelVersionDto` | UC-30-08 nueva versión |
| `PublishViewContractDto` (+ `ViewFieldInputDto`, `ViewSortOptionInputDto`, `ViewActionInputDto`, `ViewKpiInputDto`, `ViewStateInputDto`) | UC-30-02 publicar contrato de vista |
| `UpsertViewPreferencesDto` | UC-30-09 preferencias de usuario |
| `ReadModelDefinitionResponseDto`, `RefreshRunResponseDto`, `ViewContractResponseDto`, `ViewPreferencesResponseDto`, `ServeViewDataResponseDto`, `AvailableActionDto`, `ReadModelHealthResponseDto`, `PublicProjectionResponseDto`, `OperationResultDto` | respuestas |
