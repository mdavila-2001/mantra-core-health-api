import type { ForeignKeyTuple } from '../catalog.types';
import { accountingForeignKeys1 } from './accounting.1.fk';
import { accountingForeignKeys2 } from './accounting.2.fk';
import { adsForeignKeys1 } from './ads.1.fk';
import { adsForeignKeys2 } from './ads.2.fk';
import { adsForeignKeys3 } from './ads.3.fk';
import { audioAssetsForeignKeys } from './audio_assets.fk';
import { auditForeignKeys1 } from './audit.1.fk';
import { auditForeignKeys2 } from './audit.2.fk';
import { auditForeignKeys3 } from './audit.3.fk';
import { authProvidersForeignKeys } from './auth_providers.fk';
import { authzForeignKeys } from './authz.fk';
import { automationForeignKeys } from './automation.fk';
import { billingForeignKeys } from './billing.fk';
import { chartForeignKeys } from './chart.fk';
import { clinicalForeignKeys1 } from './clinical.1.fk';
import { clinicalForeignKeys2 } from './clinical.2.fk';
import { clinicalExtForeignKeys } from './clinical_ext.fk';
import { commonForeignKeys } from './common.fk';
import { communityForeignKeys1 } from './community.1.fk';
import { communityForeignKeys2 } from './community.2.fk';
import { consentForeignKeys } from './consent.fk';
import { crmForeignKeys1 } from './crm.1.fk';
import { crmForeignKeys2 } from './crm.2.fk';
import { delegatedAccessForeignKeys } from './delegated_access.fk';
import { diagnosticUnitsForeignKeys } from './diagnostic_units.fk';
import { diagnosticsForeignKeys1 } from './diagnostics.1.fk';
import { diagnosticsForeignKeys2 } from './diagnostics.2.fk';
import { directoryForeignKeys } from './directory.fk';
import { educationForeignKeys } from './education.fk';
import { erpForeignKeys1 } from './erp.1.fk';
import { erpForeignKeys2 } from './erp.2.fk';
import { erpForeignKeys3 } from './erp.3.fk';
import { formsForeignKeys } from './forms.fk';
import { geoForeignKeys } from './geo.fk';
import { healthContextForeignKeys } from './health_context.fk';
import { healthDataForeignKeys } from './health_data.fk';
import { iamForeignKeys } from './iam.fk';
import { identityAssuranceForeignKeys } from './identity_assurance.fk';
import { insuranceForeignKeys1 } from './insurance.1.fk';
import { insuranceForeignKeys2 } from './insurance.2.fk';
import { integrationContractsForeignKeys } from './integration_contracts.fk';
import { integrationsForeignKeys } from './integrations.fk';
import { marketingForeignKeys } from './marketing.fk';
import { messagingForeignKeys } from './messaging.fk';
import { organizationExtensionsForeignKeys } from './organization_extensions.fk';
import { paymentsForeignKeys1 } from './payments.1.fk';
import { paymentsForeignKeys2 } from './payments.2.fk';
import { pharmacyForeignKeys } from './pharmacy.fk';
import { pharmacyInventoryForeignKeys } from './pharmacy_inventory.fk';
import { platformOpsForeignKeys1 } from './platform_ops.1.fk';
import { platformOpsForeignKeys2 } from './platform_ops.2.fk';
import { polyglotStorageForeignKeys } from './polyglot_storage.fk';
import { practiceForeignKeys } from './practice.fk';
import { proceduresPerioperativeForeignKeys1 } from './procedures_perioperative.1.fk';
import { proceduresPerioperativeForeignKeys2 } from './procedures_perioperative.2.fk';
import { profilesForeignKeys } from './profiles.fk';
import { promotionsForeignKeys } from './promotions.fk';
import { qaLabForeignKeys } from './qa_lab.fk';
import { readModelsForeignKeys } from './read_models.fk';
import { reportingForeignKeys } from './reporting.fk';
import { schedulingForeignKeys } from './scheduling.fk';
import { systemContextForeignKeys } from './system_context.fk';
import { systemOpsForeignKeys } from './system_ops.fk';
import { telemetryForeignKeys } from './telemetry.fk';
import { terminologyForeignKeys } from './terminology.fk';
import { trackingForeignKeys } from './tracking.fk';
import { workflowForeignKeys } from './workflow.fk';

/**
 * Catálogo de claves foráneas indexado por schema. Cada schema apunta a los
 * lotes en que se troceó su definición (ningún archivo supera 300 líneas).
 */
export const foreignKeyCatalog: Readonly<Record<string, readonly (readonly ForeignKeyTuple[])[]>> = {
  accounting: [accountingForeignKeys1, accountingForeignKeys2],
  ads: [adsForeignKeys1, adsForeignKeys2, adsForeignKeys3],
  audio_assets: [audioAssetsForeignKeys],
  audit: [auditForeignKeys1, auditForeignKeys2, auditForeignKeys3],
  auth_providers: [authProvidersForeignKeys],
  authz: [authzForeignKeys],
  automation: [automationForeignKeys],
  billing: [billingForeignKeys],
  chart: [chartForeignKeys],
  clinical: [clinicalForeignKeys1, clinicalForeignKeys2],
  clinical_ext: [clinicalExtForeignKeys],
  common: [commonForeignKeys],
  community: [communityForeignKeys1, communityForeignKeys2],
  consent: [consentForeignKeys],
  crm: [crmForeignKeys1, crmForeignKeys2],
  delegated_access: [delegatedAccessForeignKeys],
  diagnostic_units: [diagnosticUnitsForeignKeys],
  diagnostics: [diagnosticsForeignKeys1, diagnosticsForeignKeys2],
  directory: [directoryForeignKeys],
  education: [educationForeignKeys],
  erp: [erpForeignKeys1, erpForeignKeys2, erpForeignKeys3],
  forms: [formsForeignKeys],
  geo: [geoForeignKeys],
  health_context: [healthContextForeignKeys],
  health_data: [healthDataForeignKeys],
  iam: [iamForeignKeys],
  identity_assurance: [identityAssuranceForeignKeys],
  insurance: [insuranceForeignKeys1, insuranceForeignKeys2],
  integration_contracts: [integrationContractsForeignKeys],
  integrations: [integrationsForeignKeys],
  marketing: [marketingForeignKeys],
  messaging: [messagingForeignKeys],
  organization_extensions: [organizationExtensionsForeignKeys],
  payments: [paymentsForeignKeys1, paymentsForeignKeys2],
  pharmacy: [pharmacyForeignKeys],
  pharmacy_inventory: [pharmacyInventoryForeignKeys],
  platform_ops: [platformOpsForeignKeys1, platformOpsForeignKeys2],
  polyglot_storage: [polyglotStorageForeignKeys],
  practice: [practiceForeignKeys],
  procedures_perioperative: [proceduresPerioperativeForeignKeys1, proceduresPerioperativeForeignKeys2],
  profiles: [profilesForeignKeys],
  promotions: [promotionsForeignKeys],
  qa_lab: [qaLabForeignKeys],
  read_models: [readModelsForeignKeys],
  reporting: [reportingForeignKeys],
  scheduling: [schedulingForeignKeys],
  system_context: [systemContextForeignKeys],
  system_ops: [systemOpsForeignKeys],
  telemetry: [telemetryForeignKeys],
  terminology: [terminologyForeignKeys],
  tracking: [trackingForeignKeys],
  workflow: [workflowForeignKeys],
};
