# Common · Controllers

Thin HTTP layer. Controllers validate params (`ParseUUIDPipe`), read the caller
via `@CurrentUser()`, delegate to a service, and return a response DTO. All
handlers are protected by the global `JwtAuthGuard`; the internal callback also
requires a role via the global `RolesGuard`.

| Controller | Base path | Endpoints |
|---|---|---|
| `CommonIdentifiersController` | `/common/identifiers` | `POST /` (201) |
| `CommonContactPointsController` | `/common/contact-points` | `POST /` (201), `POST /:id/verify` (200) |
| `CommonAddressesController` | `/common/addresses` | `POST /` (201) |
| `CommonFilesController` | `/common/files` | `POST /` (201), `POST /:id/versions` (201), `POST /:id/versions/:vid/derivatives` (201), `POST /:id/links` (201), `DELETE /:id` (200), `POST /:id/download-url` (201) |
| `InternalFilesController` | `/internal/files` | `POST /versions/:vid/scan-result` (200, `@Roles('SECURITY_ADMIN')`) |

## Tests

`*.controller.spec.ts` are unit tests with a fully mocked service. They assert the
controller delegates with the right arguments (`id`, `dto`, `user`) and returns
the service result verbatim.
