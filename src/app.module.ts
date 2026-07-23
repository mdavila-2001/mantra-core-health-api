import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { databaseEnvSchema } from './config/database.env';
import { IamModule } from './modules/iam/iam.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { TerminologyModule } from './modules/terminology/terminology.module';
import { AuthzModule } from './modules/authz/authz.module';
import { ConsentModule } from './modules/consent/consent.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { AdsModule } from './modules/ads/ads.module';
import { AuditModule } from './modules/audit/audit.module';
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
import { TrackingModule } from './modules/tracking/tracking.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: databaseEnvSchema,
    }),
    DatabaseModule,
    IamModule,
    DirectoryModule,
    ProfilesModule,
    TerminologyModule,
    AuthzModule,
    ConsentModule,
    AccountingModule,
    AdsModule,
    AuditModule,
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
    SystemContextModule,
    SystemOpsModule,
    TelemetryModule,
    TrackingModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
