/**
 * Superficie pública de la capa transversal (`src/common`).
 *
 * Autenticación, autorización, manejo de errores, paginación y catálogo de
 * conceptos que comparten todos los dominios. Los módulos importan desde aquí
 * para no acoplarse a rutas internas de esta carpeta.
 */

// Auth / Authz
export { AuthModule } from './auth/auth.module';
export { TokenService } from './auth/token.service';
export type { IssuedTokens } from './auth/token.service';
export { JwtAuthGuard } from './auth/jwt-auth.guard';
export { RolesGuard } from './auth/roles.guard';
export { CurrentUser } from './auth/current-user.decorator';
export { Public } from './auth/public.decorator';
export { Roles } from './auth/roles.decorator';
export { authEnvSchema, loadAuthEnv } from './auth/auth.env';
export type { AuthEnv } from './auth/auth.env';
export type { AuthenticatedUser } from './auth/authenticated-user.interface';
export type { JwtPayload } from './auth/jwt-payload.interface';

// Errores
export { ErrorCode } from './errors/error-codes';
export {
  DomainException,
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
  ConcurrencyConflictException,
} from './errors/domain.exception';
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Paginación
export { PaginationQueryDto } from './dto/pagination-query.dto';
export { PageResponseDto, PageMetaDto } from './dto/page-response.dto';

// Persistencia
export { createdBy, touch } from './persistence/audit-fields';
export type { AuditableCreate } from './persistence/audit-fields';

// Conceptos de dominio
export {
  CONCEPTS,
  CONCEPT_DEFS,
  SEED,
  deterministicId,
  SALUD_UUID_NAMESPACE,
} from './constants/concepts';
export type { ConceptName } from './constants/concepts';
