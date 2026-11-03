# Profiles — Controllers

Thin HTTP layer under the `profiles` base path. Controllers validate params
(`@Param(..., ParseUUIDPipe)`), read the actor with `@CurrentUser()`, and delegate
to the domain service. All operations require the `SECURITY_ADMIN` role
(`@Roles('SECURITY_ADMIN')`) and carry `@ApiBearerAuth()` / `@ApiOperation` for
Swagger.

## `ProfilesPatientsController`

Persons and patients: `POST /profiles/patients` (05-01),
`POST /profiles/persons/:personId/account-links` (05-02),
`POST /profiles/patients/:profileId/identity-links` (05-07),
`POST /profiles/patients/merge` (05-08),
`POST /profiles/patients/merge/:eventId/reverse` (05-09),
`POST /profiles/patients/:profileId/related-persons` (05-10),
`POST /profiles/patients/:profileId/portal-proxies` (05-11),
`POST /profiles/persons/:personId/decease` (05-12).

## `ProfilesPractitionersController`

Health workforce: `POST /profiles/practitioners` (05-03),
`POST /profiles/practitioners/:profileId/jurisdiction-authorizations` (05-04),
`POST /profiles/credentials/:credentialId/verify` (05-05),
`POST /profiles/practitioners/:profileId/specialties` (05-06).

Creation endpoints return 201; state transitions that don't create a primary
resource (`verify`, `decease`) return 200.

## Tests

`*.spec.ts` mock the services and assert delegation with the right arguments.
