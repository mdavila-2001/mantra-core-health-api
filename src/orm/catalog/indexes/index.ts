import type { IndexTuple } from '../catalog.types';
import { accountingIndexes1 } from './accounting.1.idx';
import { accountingIndexes2 } from './accounting.2.idx';
import { adsIndexes1 } from './ads.1.idx';
import { adsIndexes2 } from './ads.2.idx';
import { adsIndexes3 } from './ads.3.idx';
import { auditIndexes1 } from './audit.1.idx';
import { auditIndexes2 } from './audit.2.idx';
import { auditIndexes3 } from './audit.3.idx';
import { auditIndexes4 } from './audit.4.idx';
import { audioAssetsIndexes } from './audio_assets.idx';
import { authProvidersIndexes } from './auth_providers.idx';
import { authzIndexes } from './authz.idx';
import { automationIndexes } from './automation.idx';
import { billingIndexes } from './billing.idx';
import { chartIndexes } from './chart.idx';
import { clinicalIndexes1 } from './clinical.1.idx';
import { clinicalIndexes2 } from './clinical.2.idx';
import { clinicalExtIndexes } from './clinical_ext.idx';
import { commonIndexes } from './common.idx';
import { communityIndexes1 } from './community.1.idx';
import { communityIndexes2 } from './community.2.idx';
import { consentIndexes } from './consent.idx';
import { crmIndexes1 } from './crm.1.idx';
import { crmIndexes2 } from './crm.2.idx';
import { crossStoreConsistencyIndexes } from './cross_store_consistency.idx';
import { delegatedAccessIndexes } from './delegated_access.idx';
import { diagnosticUnitsIndexes } from './diagnostic_units.idx';
import { diagnosticsIndexes1 } from './diagnostics.1.idx';
import { diagnosticsIndexes2 } from './diagnostics.2.idx';
import { directoryIndexes } from './directory.idx';
import { educationIndexes } from './education.idx';
import { erpIndexes1 } from './erp.1.idx';
import { erpIndexes2 } from './erp.2.idx';
import { erpIndexes3 } from './erp.3.idx';
import { formsIndexes } from './forms.idx';
import { geoIndexes } from './geo.idx';
import { healthContextIndexes } from './health_context.idx';
import { healthDataIndexes1 } from './health_data.1.idx';
import { healthDataIndexes2 } from './health_data.2.idx';
import { iamIndexes } from './iam.idx';
import { identityAssuranceIndexes } from './identity_assurance.idx';
import { insuranceIndexes1 } from './insurance.1.idx';
import { insuranceIndexes2 } from './insurance.2.idx';
import { integrationContractsIndexes } from './integration_contracts.idx';
import { integrationsIndexes } from './integrations.idx';
import { lakehouseIndexes } from './lakehouse.idx';
import { marketingIndexes } from './marketing.idx';
import { messagingIndexes } from './messaging.idx';
import { objectStorageIndexes } from './object_storage.idx';
import { organizationExtensionsIndexes } from './organization_extensions.idx';
import { paymentsIndexes1 } from './payments.1.idx';
import { paymentsIndexes2 } from './payments.2.idx';
import { paymentsIndexes3 } from './payments.3.idx';
import { pharmacyIndexes } from './pharmacy.idx';
import { pharmacyInventoryIndexes } from './pharmacy_inventory.idx';
import { platformOpsIndexes1 } from './platform_ops.1.idx';
import { platformOpsIndexes2 } from './platform_ops.2.idx';
import { polyglotStorageIndexes } from './polyglot_storage.idx';
import { practiceIndexes } from './practice.idx';
import { proceduresPerioperativeIndexes1 } from './procedures_perioperative.1.idx';
import { proceduresPerioperativeIndexes2 } from './procedures_perioperative.2.idx';
import { profilesIndexes } from './profiles.idx';
import { promotionsIndexes } from './promotions.idx';
import { qaLabIndexes } from './qa_lab.idx';
import { readModelsIndexes } from './read_models.idx';
import { reportingIndexes } from './reporting.idx';
import { schedulingIndexes } from './scheduling.idx';
import { systemContextIndexes } from './system_context.idx';
import { systemOpsIndexes1 } from './system_ops.1.idx';
import { systemOpsIndexes2 } from './system_ops.2.idx';
import { telemetryIndexes } from './telemetry.idx';
import { terminologyIndexes } from './terminology.idx';
import { trackingIndexes } from './tracking.idx';
import { vectorRagIndexes } from './vector_rag.idx';
import { workflowIndexes } from './workflow.idx';

/**
 * Catálogo de índices secundarios indexado por schema. Cada schema apunta a los
 * lotes en que se troceó su definición (ningún archivo supera 300 líneas).
 */
export const indexCatalog: Readonly<Record<string, readonly (readonly IndexTuple[])[]>> = {
  accounting: [accountingIndexes1, accountingIndexes2],
  ads: [adsIndexes1, adsIndexes2, adsIndexes3],
  audit: [auditIndexes1, auditIndexes2, auditIndexes3, auditIndexes4],
  audio_assets: [audioAssetsIndexes],
  auth_providers: [authProvidersIndexes],
  authz: [authzIndexes],
  automation: [automationIndexes],
  billing: [billingIndexes],
  chart: [chartIndexes],
  clinical: [clinicalIndexes1, clinicalIndexes2],
  clinical_ext: [clinicalExtIndexes],
  common: [commonIndexes],
  community: [communityIndexes1, communityIndexes2],
  consent: [consentIndexes],
  crm: [crmIndexes1, crmIndexes2],
  cross_store_consistency: [crossStoreConsistencyIndexes],
  delegated_access: [delegatedAccessIndexes],
  diagnostic_units: [diagnosticUnitsIndexes],
  diagnostics: [diagnosticsIndexes1, diagnosticsIndexes2],
  directory: [directoryIndexes],
  education: [educationIndexes],
  erp: [erpIndexes1, erpIndexes2, erpIndexes3],
  forms: [formsIndexes],
  geo: [geoIndexes],
  health_context: [healthContextIndexes],
  health_data: [healthDataIndexes1, healthDataIndexes2],
  iam: [iamIndexes],
  identity_assurance: [identityAssuranceIndexes],
  insurance: [insuranceIndexes1, insuranceIndexes2],
  integration_contracts: [integrationContractsIndexes],
  integrations: [integrationsIndexes],
  lakehouse: [lakehouseIndexes],
  marketing: [marketingIndexes],
  messaging: [messagingIndexes],
  object_storage: [objectStorageIndexes],
  organization_extensions: [organizationExtensionsIndexes],
  payments: [paymentsIndexes1, paymentsIndexes2, paymentsIndexes3],
  pharmacy: [pharmacyIndexes],
  pharmacy_inventory: [pharmacyInventoryIndexes],
  platform_ops: [platformOpsIndexes1, platformOpsIndexes2],
  polyglot_storage: [polyglotStorageIndexes],
  practice: [practiceIndexes],
  procedures_perioperative: [proceduresPerioperativeIndexes1, proceduresPerioperativeIndexes2],
  profiles: [profilesIndexes],
  promotions: [promotionsIndexes],
  qa_lab: [qaLabIndexes],
  read_models: [readModelsIndexes],
  reporting: [reportingIndexes],
  scheduling: [schedulingIndexes],
  system_context: [systemContextIndexes],
  system_ops: [systemOpsIndexes1, systemOpsIndexes2],
  telemetry: [telemetryIndexes],
  terminology: [terminologyIndexes],
  tracking: [trackingIndexes],
  vector_rag: [vectorRagIndexes],
  workflow: [workflowIndexes],
};
