import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppReadinessService } from './app-readiness.service';
import { OrmModule, ormEnvSchema } from './orm';
import { dataSourcesEnvSchema } from './persistence';
import { PersistenceModule } from './persistence/persistence.module';
import { LoggingModule, loggingEnvSchema } from './logging';
import {
  ObservabilityModule,
  TraceResponseInterceptor,
  telemetryEnvSchema,
} from './observability';
import {
  AllExceptionsFilter,
  AuthModule,
  FileStorageModule,
  TenantContextInterceptor,
  VerificationBypassModule,
  appSecurityEnvSchema,
  authEnvSchema,
  storageEnvSchema,
  verificationBypassEnvSchema,
} from './common';
import { SeedModule } from './common/seed/seed.module';
import { seedBootEnvSchema } from './common/seed/seed-boot.env';
import { IamModule } from './modules/iam/iam.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { TerminologyModule } from './modules/terminology/terminology.module';
import { AuthzModule } from './modules/authz/authz.module';
import { ConsentModule } from './modules/consent/consent.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { AdsModule } from './modules/ads/ads.module';
import { AuditModule } from './modules/audit/audit.module';
import { AudioAssetsModule } from './modules/audio_assets/audio-assets.module';
import { audioEnvSchema } from './modules/audio_assets/audio.env';
import { AuthProvidersModule } from './modules/auth_providers/auth_providers.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BillingModule } from './modules/billing/billing.module';
import { ChartModule } from './modules/chart/chart.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { ClinicalExtModule } from './modules/clinical_ext/clinical_ext.module';
import { CommonModule } from './modules/common/common.module';
import { CommunityModule } from './modules/community/community.module';
import { CrmModule } from './modules/crm/crm.module';
import { CrossStoreConsistencyModule } from './modules/cross_store_consistency/cross_store_consistency.module';
import { DelegatedAccessModule } from './modules/delegated_access/delegated_access.module';
import { DiagnosticUnitsModule } from './modules/diagnostic_units/diagnostic_units.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { EducationModule } from './modules/education/education.module';
import { ErpModule } from './modules/erp/erp.module';
import { FormsModule } from './modules/forms/forms.module';
import { GeoModule } from './modules/geo/geo.module';
import { GraphIntelligenceModule } from './modules/graph_intelligence/graph_intelligence.module';
import { HealthContextModule } from './modules/health_context/health_context.module';
import { HealthDataModule } from './modules/health_data/health_data.module';
import { IdentityAssuranceModule } from './modules/identity_assurance/identity_assurance.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { IntegrationContractsModule } from './modules/integration_contracts/integration_contracts.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { LakehouseModule } from './modules/lakehouse/lakehouse.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ObjectStorageModule } from './modules/object_storage/object_storage.module';
import { OrganizationExtensionsModule } from './modules/organization_extensions/organization_extensions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PharmaLabModule } from './modules/pharma_lab/pharma_lab.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { PharmacyInventoryModule } from './modules/pharmacy_inventory/pharmacy_inventory.module';
import { PlatformOpsModule } from './modules/platform_ops/platform_ops.module';
import { PolyglotStorageModule } from './modules/polyglot_storage/polyglot_storage.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ProceduresPerioperativeModule } from './modules/procedures_perioperative/procedures_perioperative.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { QaLabModule } from './modules/qa_lab/qa_lab.module';
import { ReadModelsModule } from './modules/read_models/read_models.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { SystemContextModule } from './modules/system_context/system_context.module';
import { SystemOpsModule } from './modules/system_ops/system_ops.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { webAnalyticsEnvSchema } from './modules/telemetry/web-analytics.env';
import { TrackingModule } from './modules/tracking/tracking.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { TimeSeriesModule } from './modules/time_series/time_series.module';
import { VectorRagModule } from './modules/vector_rag/vector_rag.module';
// Módulos 55/56/57: almacenamiento poliglota sobre motores no-PostgreSQL.
import { DocumentStoreModule } from './modules/document_store/document_store.module';
import { RedisRuntimeModule } from './modules/redis_runtime/redis_runtime.module';
import { RedisThrottlerStorage } from './common/security/redis-throttler.storage';
import { PublicCacheInterceptor } from './common/http/public-cache.interceptor';
import { SearchPlatformModule } from './modules/search_platform/search_platform.module';

/**
 * Configura las dependencias NestJS de app.
 */
@Module({
  imports: [
    // Validación del entorno antes que nada: si falta una credencial de base de
    // datos o `LOG_LEVEL` trae un valor inválido, el proceso debe morir aquí y no
    // en la primera consulta ni en la primera línea de log. Se concatenan los dos
    // esquemas Joi (persistencia + logging) en la única validación global.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: ormEnvSchema
        .concat(dataSourcesEnvSchema)
        .concat(loggingEnvSchema)
        .concat(authEnvSchema)
        .concat(appSecurityEnvSchema)
        .concat(storageEnvSchema)
        .concat(audioEnvSchema)
        .concat(telemetryEnvSchema)
        .concat(webAnalyticsEnvSchema)
        .concat(verificationBypassEnvSchema)
        .concat(seedBootEnvSchema),
    }),
    // Rate limiting global como red anti-DoS/fuerza bruta. El límite global es
    // generoso (backstop); los endpoints sensibles (login/refresh) declaran un
    // límite estricto propio con `@Throttle`. Almacenamiento en memoria por
    // instancia; para un despliegue multi-réplica conviene el storage Redis.
    // El almacenamiento pasa a Redis (ver RedisThrottlerStorage): en memoria,
    // el límite efectivo es N veces el declarado con N réplicas, y las doce
    // pantallas públicas son la mayor superficie de ataque del sistema.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      // Se desactiva en pruebas de integración/smoke, donde todas las peticiones
      // salen del mismo IP (127.0.0.1) y comparten cubo: sin esto un smoke de
      // decenas de módulos daría 429. En producción la variable no se define.
      skipIf: () =>
        process.env.RATE_LIMIT_DISABLED === 'true' ||
        process.env.NODE_ENV === 'test',
    }),
    // Logging estructurado con pino para todas las capas. Va primero para que el
    // logger de peticiones y el `PinoLogger` estén disponibles desde el arranque.
    LoggingModule,
    // Trazas distribuidas. Global, como LoggingModule: cualquier dominio inyecta
    // `TracingService` sin reimportar nada. No arranca el SDK -eso ocurre en la
    // primera línea de `main.ts`-, solo expone la API que lo consume.
    ObservabilityModule,
    // Autenticación/autorización transversal: estrategia JWT, guards globales y
    // emisión de tokens. Global, se aplica a todos los dominios.
    AuthModule,
    // Almacenamiento de archivos: resuelve el adaptador activo (`local` en
    // disco por ahora) a partir de FILE_STORAGE_ADAPTER. Global.
    FileStorageModule,
    // Bypass de verificación DEV/TEST (corrección #12): un solo `isActive()`
    // que consumen los servicios de dominio que hoy filtran por verificación.
    VerificationBypassModule,
    // Núcleo de persistencia: conexión, inyección idempotente del DDL en el
    // arranque, verificación de fidelidad y métricas del ORM. Ver src/orm.
    OrmModule,
    // Puertos, adaptadores y enrutado read/write sobre la conexión anterior. Va
    // DESPUÉS de OrmModule porque necesita su instancia de MikroORM ya
    // construida para publicarla en el registro. No la sustituye: los módulos
    // que aún inyectan `EntityManager` siguen funcionando igual. Ver
    // src/persistence y docs/data/read-write-routing.md.
    PersistenceModule,
    // Datos estructurales iniciales (catálogo de conceptos internos). Va tras
    // OrmModule para que el esquema esté materializado cuando corre el seed.
    SeedModule,
    IamModule,
    DirectoryModule,
    ProfilesModule,
    TerminologyModule,
    AuthzModule,
    ConsentModule,
    AccountingModule,
    AdsModule,
    AuditModule,
    AudioAssetsModule,
    AuthProvidersModule,
    AutomationModule,
    BillingModule,
    ChartModule,
    ClinicalModule,
    ClinicalExtModule,
    CommonModule,
    CommunityModule,
    CrmModule,
    CrossStoreConsistencyModule,
    DelegatedAccessModule,
    DiagnosticUnitsModule,
    DiagnosticsModule,
    EducationModule,
    ErpModule,
    FormsModule,
    GeoModule,
    GraphIntelligenceModule,
    HealthContextModule,
    HealthDataModule,
    IdentityAssuranceModule,
    InsuranceModule,
    IntegrationContractsModule,
    IntegrationsModule,
    LakehouseModule,
    MarketingModule,
    MessagingModule,
    ObjectStorageModule,
    OrganizationExtensionsModule,
    PaymentsModule,
    PharmaLabModule,
    PharmacyModule,
    PharmacyInventoryModule,
    PlatformOpsModule,
    PolyglotStorageModule,
    PracticeModule,
    ProceduresPerioperativeModule,
    PromotionsModule,
    QaLabModule,
    ReadModelsModule,
    ReportingModule,
    SchedulingModule,
    SurveysModule,
    SystemContextModule,
    SystemOpsModule,
    TelemetryModule,
    TrackingModule,
    WorkflowModule,
    TimeSeriesModule,
    VectorRagModule,
    DocumentStoreModule,
    RedisRuntimeModule,
    SearchPlatformModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppReadinessService,
    // Filtro global de excepciones: homogeneiza el contrato de error y decide
    // qué se registra y qué se oculta al cliente. Ver AllExceptionsFilter.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Guard de rate limiting aplicado a todas las rutas HTTP.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: ThrottlerStorage, useClass: RedisThrottlerStorage },
    // Sólo actúa sobre manejadores `@Public()`: una respuesta con sesión no
    // puede llevar `Cache-Control: public` ni de casualidad.
    { provide: APP_INTERCEPTOR, useClass: PublicCacheInterceptor },
    // Contexto de tenant por request: valida X-Tenant-Id contra la membresía del
    // actor y, con RLS_ENFORCE=true, fija app.current_tenant_id para las políticas.
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    // Cabecera `x-trace-id` en la respuesta: el identificador que un usuario
    // puede entregar a soporte para que localice la traza exacta en Jaeger.
    { provide: APP_INTERCEPTOR, useClass: TraceResponseInterceptor },
  ],
})
export class AppModule {}
