# Controladores — Consent

Capa fina sobre HTTP: `@ApiTags` + `@ApiBearerAuth()`, `@HttpCode` correcto,
validación de params con `ParseUUIDPipe`, `@CurrentUser()` para el actor y
`@Roles('SECURITY_ADMIN')`. Delegan en el servicio de dominio y devuelven un DTO
de respuesta; no contienen lógica de negocio.

| Controlador | Rutas base | UCs |
|-------------|-----------|-----|
| `ConsentsController` | `/consent/consents` | 01, 02, 09 |
| `HipaaAuthorizationsController` | `/consent/hipaa-authorizations` | 04, 05 |
| `PatientObjectionsController` | `/consent/patient-objections` | 03, 12 |
| `PrivacyRestrictionsController` | `/consent/privacy-restrictions` | 07 |
| `ProcessingLegalBasesController` | `/consent/processing-legal-bases` | 06 |
| `TreatmentInformedConsentsController` | `/consent/treatment-informed-consents` | 08 |
| `ConsentEvidenceController` | `/consent/consent-evidence` | 10 |
| `ConsentSweepController` | `/consent/internal/expiration-sweep` | 11 |

Test de delegación: `consent.controllers.spec.ts` (servicios mockeados).
