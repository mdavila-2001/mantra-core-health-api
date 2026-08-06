/**
 * Superficie pública de la capa transversal (`src/common`).
 *
 * Autenticación, autorización, manejo de errores, paginación y catálogo de
 * conceptos que comparten todos los dominios. Los módulos importan desde aquí
 * para no acoplarse a rutas internas de esta carpeta.
 */

// Auth / Authz
export { AuthModule } from './auth/auth.module';
export { AuthTokenModule } from './auth/auth-token.module';
export { TokenService } from './auth/token.service';
export type { IssuedTokens, TokenDisplayData } from './auth/token.service';
export { JwtAuthGuard } from './auth/jwt-auth.guard';
export { RolesGuard } from './auth/roles.guard';
export { CurrentUser } from './auth/current-user.decorator';
export { Public } from './auth/public.decorator';
export { Roles } from './auth/roles.decorator';
export { RequiresVerifiedIdentity } from './auth/requires-verified-identity.decorator';
export { VerifiedIdentityGuard } from './auth/verified-identity.guard';
export { authEnvSchema, loadAuthEnv } from './auth/auth.env';
export type { AuthEnv } from './auth/auth.env';
export {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  loadRefreshCookieEnv,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
} from './auth/refresh-cookie';
export type { RefreshCookieEnv } from './auth/refresh-cookie';
export { runWithTenant, getCurrentTenantId } from './tenant/tenant-context';
export type { TenantContext } from './tenant/tenant-context';
export { TenantContextInterceptor } from './tenant/tenant-context.interceptor';
export {
  TenantAgnostic,
  IS_TENANT_AGNOSTIC_KEY,
} from './tenant/tenant-agnostic.decorator';
export type { AuthenticatedUser } from './auth/authenticated-user.interface';
export type { JwtPayload } from './auth/jwt-payload.interface';

// Errores
export { ErrorCode } from './errors/error-codes';
export {
  DomainException,
  UnauthorizedException,
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
  ConcurrencyConflictException,
  IdentityVerificationRequiredException,
} from './errors/domain.exception';
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Ciclo de vida del proceso (fallo terminal observable, apagado acotado)
export {
  installProcessGuards,
  installShutdownWatchdog,
  resetProcessGuardsForTests,
  resetShutdownWatchdogForTests,
} from './runtime';
export type {
  FatalLogger,
  ProcessGuardOptions,
  ShutdownWatchdogOptions,
} from './runtime';

// Resiliencia (plazos, reintentos, cortacircuitos, mamparos, exclusión mutua)
export {
  OperationTimeoutError,
  CircuitOpenError,
  BulkheadFullError,
  isTransientError,
  retryAfterFromError,
  httpStatusOf,
  networkCodeOf,
  withTimeout,
  delay,
  retry,
  DEFAULT_RETRY_POLICY,
  CircuitBreaker,
  Bulkhead,
  MutexRegistry,
} from './resilience';
export type {
  RetryPolicy,
  RetryAttemptInfo,
  RetryClock,
  CircuitState,
  CircuitBreakerOptions,
  CircuitStateChange,
  CircuitSnapshot,
  BulkheadOptions,
  BulkheadSnapshot,
  ExclusiveOutcome,
  MutexSnapshot,
} from './resilience';

// Paginación
export { PaginationQueryDto } from './dto/pagination-query.dto';
export { PageResponseDto, PageMetaDto } from './dto/page-response.dto';
export {
  encodeKeysetCursor,
  decodeKeysetCursor,
} from './pagination/keyset-cursor';
export type { KeysetCursorKey } from './pagination/keyset-cursor';

// Persistencia
export { createdBy, touch } from './persistence/audit-fields';
export type { AuditableCreate } from './persistence/audit-fields';

// Criptografía
export { encryptSecret, decryptSecret } from './crypto/secret-cipher';
export {
  signPayload,
  verifySignature,
  canonicalJson,
  deriveWebhookSecret,
} from './crypto/webhook-signature';

// HTTP saliente (despacho firmado + guarda anti-SSRF)
export {
  HttpDispatcherService,
  joinUrl,
  DEFAULT_DISPATCH_TIMEOUT_MS,
} from './http/http-dispatcher.service';
export type {
  OutboundDispatchInput,
  OutboundDispatchResult,
} from './http/http-dispatcher.service';
export { assertOutboundUrlAllowed } from './http/ssrf-guard';
export { ParseOptionalLimitPipe } from './http/parse-optional-limit.pipe';
export { ParseUuidListPipe } from './http/parse-uuid-list.pipe';
export { ParseOptionalDatePipe } from './http/parse-optional-date.pipe';

// Almacenamiento de archivos (adaptador seleccionado por entorno)
export { FileStorageModule } from './storage/file-storage.module';
export { FILE_STORAGE_ADAPTER } from './storage/file-storage.adapter';
export type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
} from './storage/file-storage.adapter';
export { LocalDiskFileStorageAdapter } from './storage/local-disk-file-storage.adapter';
export { storageEnvSchema, loadStorageEnv } from './storage/storage.env';
export type { StorageEnv, FileStorageAdapterName } from './storage/storage.env';
export { appSecurityEnvSchema } from './security/app-security.env';

// Conceptos de dominio
export {
  CONCEPTS,
  CONCEPT_DEFS,
  SEED,
  deterministicId,
  SALUD_UUID_NAMESPACE,
} from './constants/concepts';
export type { ConceptName } from './constants/concepts';
