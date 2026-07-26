# Controllers — Pharmacy

`PharmacyController` (`/pharmacies`) es la única capa HTTP: fina, valida parámetros
(`@Param('...', ParseUUIDPipe)`), toma el actor con `@CurrentUser()` y delega en el
servicio de dominio. Anotada con `@ApiTags('pharmacy')`, `@ApiBearerAuth()` y
`@Roles('SECURITY_ADMIN')` a nivel de clase. Cada handler fija su `@HttpCode`
correcto (201 en altas, 200 en verify/close/retire/projection).
