// GENERADO por tools/catalog/generate-schema-descriptions.mjs — no editar a mano.
// Fuente: SALUD/Módulos/M*.md (67 módulos), sha256 7809e7022b2aff0d6e7c8cd0c817f1825419fbb44cc53fb6cf7e731a1267bdda.
// Regenerar: yarn catalog:schemas (y yarn catalog:schemas --check para verificarlo).
import type { SchemaDescription } from './schema-description';

/** La explicación de cada schema, por nombre de schema. */
export const SCHEMA_DESCRIPTIONS: Readonly<Record<string, SchemaDescription>> =
  {
    accounting: {
      moduleNumber: 16,
      moduleCode: 'accounting',
      title: 'General Ledger and Accounting Subledgers',
      domain: 'Financiero y ERP',
      business: null,
      system:
        'Módulo 16 del modelo: 42 tablas o vistas modeladas y 42 conjuntos de índices; depende de 4 módulos y lo referencian 4 módulos.',
      source: 'SALUD/Módulos/M16 accounting.md',
    },
    ads: {
      moduleNumber: 43,
      moduleCode: 'ads',
      title: 'Advertising, Assets, Delivery, Commerce and Optimization',
      domain: 'Marketing y Crecimiento',
      business:
        'Models business managers, partner sharing, ad accounts and the campaign hierarchy campaign -> ad set -> ad -> creative. Assets, audiences, targeting and pixels are separated into module 43A; delivery, insights and billing remain in module 43B.',
      system:
        'Módulo 43 del modelo: 73 tablas o vistas modeladas y 73 conjuntos de índices.',
      source: 'SALUD/Módulos/M43 ads.md',
    },
    audio_assets: {
      moduleNumber: 64,
      moduleCode: 'audio_assets',
      title: 'Audio Assets (cache-first TTS)',
      domain: 'Operaciones de Plataforma',
      business:
        'Síntesis de voz cache-first para onboarding y otras experiencias acotadas. Solo se sintetizan plantillas registradas —no existe un endpoint de TTS de texto libre—, el texto renderizado se convierte en una identidad estable por hash, y a partir de ahí el mismo audio se sirve desde almacenamiento propio en vez de volver a pedirlo al proveedor. El gasto mensual se aparta antes de generar y se liquida —o se devuelve— cuando el asset llega a un estado terminal.',
      system:
        'Módulo 64 del modelo: 4 tablas o vistas modeladas y 4 conjuntos de índices.',
      source: 'SALUD/Módulos/M64 audio_assets.md',
    },
    audit: {
      moduleNumber: 10,
      moduleCode: 'audit',
      title: 'Audit, Provenance and Version Histories',
      domain: 'Auditoría y Reporting',
      business:
        'Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation. Immutable clinical-note/file versions do not need snapshot history; their creation and access remain audited.',
      system:
        'Módulo 10 del modelo: 123 tablas o vistas modeladas y 123 conjuntos de índices.',
      source: 'SALUD/Módulos/M10 audit.md',
    },
    auth_providers: {
      moduleNumber: 40,
      moduleCode: 'auth_providers',
      title: 'Federated Authentication Providers and Identity Linking',
      domain: 'Identidad y Seguridad',
      business:
        'Generic, provider-adaptable federated login and user provisioning. Registers identity providers (OIDC, SAML 2.0, OAuth2, social, enterprise) with their protocol configuration and signing keys, binds them per tenant with auto-provisioning rules, maps external claims to platform attributes, links external subjects to platform users, and records every login attempt for security. Extends iam (authentication_credentials.identity_provider) into a first-class, configurable federation layer; distinct from module 27 identity_assurance (proofing/IAL/AAL).',
      system:
        'Módulo 40 del modelo: 10 tablas o vistas modeladas y 9 conjuntos de índices.',
      source: 'SALUD/Módulos/M40 auth_providers.md',
    },
    authz: {
      moduleNumber: 6,
      moduleCode: 'authz',
      title: 'Authorization, Purpose of Use and Field Masking',
      domain: 'Identidad y Seguridad',
      business:
        'Fine-grained control of who can do what, down to the individual field and the individual patient record. Combines role-based permissions, per-person exceptions and attribute rules to enforce least-privilege access.',
      system:
        'Módulo 06 del modelo: 15 tablas o vistas modeladas y 14 conjuntos de índices.',
      source: 'SALUD/Módulos/M06 authz.md',
    },
    automation: {
      moduleNumber: 48,
      moduleCode: 'automation',
      title: 'Automation and Multi-Agent Orchestration',
      domain: 'Operaciones de Plataforma',
      business:
        'A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for. Registers agents with versioned definitions, the tools they may call, and the guardrails/policies that bound them; orchestrates work through triggers -> workflows -> tasks -> agent runs -> steps, with per-record automations, human-in-the-loop approvals, agent memory/knowledge and a full append-only execution trail. Every automated write is attributable and auditable.',
      system:
        'Módulo 48 del modelo: 16 tablas o vistas modeladas y 16 conjuntos de índices.',
      source: 'SALUD/Módulos/M48 automation.md',
    },
    billing: {
      moduleNumber: 17,
      moduleCode: 'billing',
      title: 'Billing, Receivables, Payables and Financial Planning',
      domain: 'Financiero y ERP',
      business: null,
      system:
        'Módulo 17 del modelo: 23 tablas o vistas modeladas y 22 conjuntos de índices; depende de 3 módulos y lo referencian 3 módulos.',
      source: 'SALUD/Módulos/M17 billing.md',
    },
    chart: {
      moduleNumber: 15,
      moduleCode: 'chart',
      title: 'Versioned Patient Chart, Notes and Documents',
      domain: 'Clínico y Diagnóstico',
      business:
        'A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.',
      system:
        'Módulo 15 del modelo: 12 tablas o vistas modeladas y 11 conjuntos de índices.',
      source: 'SALUD/Módulos/M15 chart.md',
    },
    clinical: {
      moduleNumber: 8,
      moduleCode: 'clinical',
      title: 'Core Clinical Record, Orders and Encounter Logistics',
      domain: 'Clínico y Diagnóstico',
      business: null,
      system:
        'Módulo 08 del modelo: 22 tablas o vistas modeladas y 22 conjuntos de índices.',
      source: 'SALUD/Módulos/M08 clinical.md',
    },
    clinical_ext: {
      moduleNumber: 18,
      moduleCode: 'clinical_ext',
      title: 'Care Coordination, Alerts and Decision Support',
      domain: 'Clínico y Diagnóstico',
      business: null,
      system:
        'Módulo 18 del modelo: 14 tablas o vistas modeladas y 13 conjuntos de índices.',
      source: 'SALUD/Módulos/M18 clinical_ext.md',
    },
    common: {
      moduleNumber: 2,
      moduleCode: 'common',
      title: 'Shared Identifiers, Contacts, Addresses and Files',
      domain: 'Núcleo y Terminología',
      business:
        'Reusable official identifiers, contact channels, international addresses and a storage-provider-neutral file catalog. Medical files are logical records with immutable content versions and explicit links to patients, reports, notes, studies, posts or financial records.',
      system:
        'Módulo 02 del modelo: 7 tablas o vistas modeladas y 7 conjuntos de índices; lo referencian 5 módulos.',
      source: 'SALUD/Módulos/M02 common.md',
    },
    community: {
      moduleNumber: 19,
      moduleCode: 'community',
      title: 'Public Profiles, Social Graph, Messaging and Moderation',
      domain: 'Marketing y Crecimiento',
      business:
        'A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites. Insurers and brokers may have public information profiles only when product policy enables them. Public content is isolated from the clinical record. Reviews can be encounter-verified without making encounter identifiers public.',
      system:
        'Módulo 19 del modelo: 39 tablas o vistas modeladas y 39 conjuntos de índices.',
      source: 'SALUD/Módulos/M19 community.md',
    },
    consent: {
      moduleNumber: 7,
      moduleCode: 'consent',
      title: 'Privacy Directives, Legal Bases and Consent Evidence',
      domain: 'Identidad y Seguridad',
      business:
        'Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections. Consent is never treated as the universal basis for treatment, payment, operations or every use of health data. Every decision is jurisdiction-, purpose- and version-aware and retains reproducible evidence.',
      system:
        'Módulo 07 del modelo: 10 tablas o vistas modeladas y 10 conjuntos de índices.',
      source: 'SALUD/Módulos/M07 consent.md',
    },
    crm: {
      moduleNumber: 49,
      moduleCode: 'crm',
      title: 'Customer and Partner Relationship Management',
      domain: 'Marketing y Crecimiento',
      business:
        'The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings, notes, tasks), and a dedicated partnerships/alliances registry that ties commercial relationships to formal contracts (module 38 ERP) and advertising partners (module 43 ads). This is the commercial system-of-record for the operator, kept separate from clinical patient data.',
      system:
        'Módulo 49 del modelo: 33 tablas o vistas modeladas y 31 conjuntos de índices; depende de 2 módulos y lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M49 crm.md',
    },
    cross_store_consistency: {
      moduleNumber: 62,
      moduleCode: 'cross_store_consistency',
      title: 'Outbox Projection, Reconciliation and Deletion Propagation',
      domain: 'Datos y NoSQL',
      business:
        'Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency. All domain writes commit only to PostgreSQL plus outbox; persistent workers update secondary stores idempotently.',
      system:
        'Módulo 62 del modelo: 20 tablas o vistas modeladas y 20 conjuntos de índices; depende de 2 módulos.',
      source: 'SALUD/Módulos/M62 cross_store_consistency.md',
    },
    data_catalog: {
      moduleNumber: 67,
      moduleCode: 'data_catalog',
      title: 'Data Catalog — Business Justification of Tables and Columns',
      domain: 'Operaciones de Plataforma',
      business:
        'Responde, para cada tabla y cada columna de la base, qué es, por qué existe y quién responde por ella. Descubre la estructura real leyendo el catálogo del motor (`pg_catalog`), la compara con lo observado en el escaneo anterior y deja cada cambio como evento. Sobre esa estructura guarda una ficha de justificación por tabla y por columna —definición, propósito, por qué hace falta, grano de fila, responsables, sensibilidad— con revisiones inmutables, evidencia que la respalda (`VAULT_NOTE`, migración, código, OpenAPI) y una aprobación que decide otra persona que quien la escribió. Lo importado de la bóveda entra como borrador con origen `IMPORTED_VAULT` y nunca se aprueba solo. Es la fuente que el portal de superadministración muestra en «Catálogo de datos».',
      system:
        'Módulo 67 del modelo: 8 tablas o vistas modeladas; depende de 1 módulo.',
      source: 'SALUD/Módulos/M67 data_catalog.md',
    },
    delegated_access: {
      moduleNumber: 29,
      moduleCode: 'delegated_access',
      title: 'Delegated Access and Scoped Infrastructure Users',
      domain: 'Identidad y Seguridad',
      business:
        'Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.',
      system:
        'Módulo 29 del modelo: 7 tablas o vistas modeladas y 7 conjuntos de índices.',
      source: 'SALUD/Módulos/M29 delegated_access.md',
    },
    deployment: {
      moduleNumber: 21,
      moduleCode: 'deployment',
      title: 'Deployment, Data Centers and Regional Topology',
      domain: 'Operaciones de Plataforma',
      business: null,
      system: 'Módulo 21 del modelo: 0 tablas o vistas modeladas.',
      source: 'SALUD/Módulos/M21 deployment.md',
    },
    diagnostic_units: {
      moduleNumber: 23,
      moduleCode: 'diagnostic_units',
      title: 'Diagnostic Units, Studies, Specialists and Prices',
      domain: 'Clínico y Diagnóstico',
      business:
        'Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices. Clinical results remain in diagnostics; this module describes the provider and the services it offers to patients, doctors and insurers.',
      system:
        'Módulo 23 del modelo: 10 tablas o vistas modeladas y 10 conjuntos de índices.',
      source: 'SALUD/Módulos/M23 diagnostic_units.md',
    },
    diagnostics: {
      moduleNumber: 20,
      moduleCode: 'diagnostics',
      title: 'Laboratory, Medical Imaging and Clinical Media',
      domain: 'Clínico y Diagnóstico',
      business:
        'Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage. Supports one report with many result observations, specimens, images and attachments instead of a single file link.',
      system:
        'Módulo 20 del modelo: 36 tablas o vistas modeladas y 36 conjuntos de índices; lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M20 diagnostics.md',
    },
    directory: {
      moduleNumber: 4,
      moduleCode: 'directory',
      title: 'Tenants, Organizations, Sites and Directory',
      domain: 'Núcleo y Terminología',
      business:
        "Models each client organization and its sites, and keeps every organization's data strictly isolated. Supports anything from a single independent doctor to multi-site hospital networks, diagnostic units, pharmacies, insurers, brokers and external authorities. Specialized entities keep their own tenant/data boundary even when hosted at another site.",
      system:
        'Módulo 04 del modelo: 7 tablas o vistas modeladas y 7 conjuntos de índices; lo referencian 11 módulos.',
      source: 'SALUD/Módulos/M04 directory.md',
    },
    document_store: {
      moduleNumber: 55,
      moduleCode: 'document_store',
      title:
        'Document Store for FHIR, Variable Payloads and Versioned Snapshots',
      domain: 'Datos y NoSQL',
      business:
        'Stores variable, versioned and externally shaped documents without replacing relational clinical, financial or authorization sources of truth. Every PHI-bearing document carries tenant, patient, classification, encryption, retention and lineage metadata.',
      system:
        'Módulo 55 del modelo: 13 tablas o vistas modeladas y 13 conjuntos de índices; depende de 5 módulos.',
      source: 'SALUD/Módulos/M55 document_store.md',
    },
    education: {
      moduleNumber: 47,
      moduleCode: 'education',
      title: 'Medical Education and Continuing Professional Development',
      domain: 'Marketing y Crecimiento',
      business:
        'A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading, completion certificates, and accredited Continuing-Medical-Education (CME) credits tied to a practitioner\'s specialties and jurisdiction licensing (module 05). Content is governed and versioned; certificates are verifiable. Integrates with scheduling for live sessions and payments for paid courses.',
      system:
        'Módulo 47 del modelo: 15 tablas o vistas modeladas y 15 conjuntos de índices.',
      source: 'SALUD/Módulos/M47 education.md',
    },
    erp: {
      moduleNumber: 38,
      moduleCode: 'erp',
      title: 'Internal ERP, Contracts, HR and Organization',
      domain: 'Financiero y ERP',
      business:
        'Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B). Adds the organizational backbone: a general contract registry (employment, service, vendor, lease, partnership) with parties, lines, milestones and documents; and human-resources structure — departments, positions, employment records, assignments, time-off and performance — hung off the existing payroll employee master in accounting. Assets, payroll runs and vendors already modelled in accounting/billing are referenced, not duplicated.',
      system:
        'Módulo 38 del modelo: 52 tablas o vistas modeladas y 51 conjuntos de índices; depende de 6 módulos y lo referencian 6 módulos.',
      source: 'SALUD/Módulos/M38 erp.md',
    },
    forms: {
      moduleNumber: 9,
      moduleCode: 'forms',
      title: 'Dynamic Forms and Extensibility Governance',
      domain: 'Clínico y Diagnóstico',
      business:
        'Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.',
      system:
        'Módulo 09 del modelo: 17 tablas o vistas modeladas y 16 conjuntos de índices.',
      source: 'SALUD/Módulos/M09 forms.md',
    },
    geo: {
      moduleNumber: 13,
      moduleCode: 'geo',
      title: 'Geolocation and Mobile Tracking',
      domain: 'Núcleo y Terminología',
      business:
        'Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.',
      system:
        'Módulo 13 del modelo: 6 tablas o vistas modeladas y 6 conjuntos de índices.',
      source: 'SALUD/Módulos/M13 geo.md',
    },
    graph_intelligence: {
      moduleNumber: 61,
      moduleCode: 'graph_intelligence',
      title: 'Graph Projections for Relationships, Referrals and Risk',
      domain: 'Datos y NoSQL',
      business:
        'Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage. The graph is optional and derived. PostgreSQL remains canonical for identities, contracts, claims, payments and clinical records.',
      system:
        'Módulo 61 del modelo: 13 tablas o vistas modeladas y 13 conjuntos de índices; depende de 3 módulos.',
      source: 'SALUD/Módulos/M61 graph_intelligence.md',
    },
    health_context: {
      moduleNumber: 44,
      moduleCode: 'health_context',
      title: 'Country Health Environment Context',
      domain: 'Núcleo y Terminología',
      business:
        'Stores country-level health-environment context collected periodically by governed agents. Raw observations, evidence, structured facts and approved versioned summaries remain traceable to source and collection run.',
      system:
        'Módulo 44 del modelo: 10 tablas o vistas modeladas y 10 conjuntos de índices.',
      source: 'SALUD/Módulos/M44 health_context.md',
    },
    health_data: {
      moduleNumber: 52,
      moduleCode: 'health_data_platform',
      title:
        'International Health Data Platform, Interoperability and Longitudinal Record',
      domain: 'Datos y NoSQL',
      business:
        'Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports, de-identification and OMOP transformation.',
      system:
        'Módulo 52 del modelo: 34 tablas o vistas modeladas y 34 conjuntos de índices; lo referencian 2 módulos.',
      source: 'SALUD/Módulos/M52 health_data_platform.md',
    },
    iam: {
      moduleNumber: 1,
      moduleCode: 'iam',
      title: 'Identity & Access — User Accounts and Security',
      domain: 'Identidad y Seguridad',
      business:
        'Manages login accounts, credentials, MFA, devices and sessions. A user record is an authenticating account, not a person, patient or practitioner. Human identity and role profiles are modeled separately in Module 05 and linked optionally so patients and external professionals can exist without portal credentials.',
      system:
        'Módulo 01 del modelo: 14 tablas o vistas modeladas y 14 conjuntos de índices; lo referencian 2 módulos.',
      source: 'SALUD/Módulos/M01 iam.md',
    },
    identity_assurance: {
      moduleNumber: 27,
      moduleCode: 'identity_assurance',
      title: 'Identity Proofing, Assertions and Fraud Controls',
      domain: 'Identidad y Seguridad',
      business:
        'Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms. Generic integration retries remain in integrations; these tables preserve identity-specific evidence, checks and decisions.',
      system:
        'Módulo 27 del modelo: 11 tablas o vistas modeladas y 11 conjuntos de índices.',
      source: 'SALUD/Módulos/M27 identity_assurance.md',
    },
    insurance: {
      moduleNumber: 26,
      moduleCode: 'insurance',
      title: 'Insurance Networks, Operations, Appeals and Reconciliation',
      domain: 'Financiero y ERP',
      business:
        'Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor. Each relationship is temporal, auditable and scoped.',
      system:
        'Módulo 26 del modelo: 31 tablas o vistas modeladas y 31 conjuntos de índices.',
      source: 'SALUD/Módulos/M26 insurance.md',
    },
    integration_contracts: {
      moduleNumber: 31,
      moduleCode: 'integration_contracts',
      title: 'Governed Backend-to-Backend Contracts',
      domain: 'Integraciones y Contratos',
      business:
        'Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.',
      system:
        'Módulo 31 del modelo: 9 tablas o vistas modeladas y 9 conjuntos de índices.',
      source: 'SALUD/Módulos/M31 integration_contracts.md',
    },
    integrations: {
      moduleNumber: 12,
      moduleCode: 'integrations',
      title: 'External Connectivity and Messaging',
      domain: 'Integraciones y Contratos',
      business:
        'The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.',
      system:
        'Módulo 12 del modelo: 10 tablas o vistas modeladas y 10 conjuntos de índices.',
      source: 'SALUD/Módulos/M12 integrations.md',
    },
    integrity: {
      moduleNumber: 33,
      moduleCode: 'integrity',
      title: 'Concurrency, Constraints and Integrity Matrix',
      domain: 'Integraciones y Contratos',
      business: null,
      system: 'Módulo 33 del modelo: 0 tablas o vistas modeladas.',
      source: 'SALUD/Módulos/M33 integrity.md',
    },
    lakehouse: {
      moduleNumber: 63,
      moduleCode: 'lakehouse',
      title: 'Lakehouse, Analytical Data Products and Research Releases',
      domain: 'Datos y NoSQL',
      business:
        'Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release. Operational databases are not queried as an ad hoc warehouse; transformations are explicit, versioned and reproducible.',
      system:
        'Módulo 63 del modelo: 18 tablas o vistas modeladas y 18 conjuntos de índices; depende de 3 módulos.',
      source: 'SALUD/Módulos/M63 lakehouse.md',
    },
    marketing: {
      moduleNumber: 50,
      moduleCode: 'marketing',
      title: 'Marketing Automation, Journeys and Attribution',
      domain: 'Marketing y Crecimiento',
      business:
        'Multi-channel marketing on top of the CRM (module 49), the messaging fabric (module 35) and the loyalty/promotions engine (module 51). Defines audience segments, marketing campaigns and their members, multi-step journeys/flows with triggers and waits, reusable content templates, trackable UTM links, and multi-touch attribution. Ties campaigns to paid advertising (module 43 ads) and to promotions so spend, reach and conversions are measurable end to end. Consent-gated; no clinical PHI is used for targeting.',
      system:
        'Módulo 50 del modelo: 11 tablas o vistas modeladas y 11 conjuntos de índices.',
      source: 'SALUD/Módulos/M50 marketing.md',
    },
    messaging: {
      moduleNumber: 35,
      moduleCode: 'messaging',
      title: 'Domain Events, Outbox, Queues and Notification Delivery',
      domain: 'Integraciones y Contratos',
      business:
        'Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence. User notification delivery is separated into module 35B while remaining in the same messaging schema.',
      system:
        'Módulo 35 del modelo: 16 tablas o vistas modeladas y 16 conjuntos de índices.',
      source: 'SALUD/Módulos/M35 messaging.md',
    },
    object_storage: {
      moduleNumber: 60,
      moduleCode: 'object_storage',
      title: 'Object Storage, Medical Media and PACS Catalog',
      domain: 'Datos y NoSQL',
      business:
        'Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads. The database stores metadata, hashes, retention, encryption, legal hold and object locations; binary content remains in object storage/PACS.',
      system:
        'Módulo 60 del modelo: 17 tablas o vistas modeladas y 17 conjuntos de índices; depende de 4 módulos.',
      source: 'SALUD/Módulos/M60 object_storage.md',
    },
    organization_extensions: {
      moduleNumber: 22,
      moduleCode: 'organization_extensions',
      title: 'Healthcare Organization Specializations',
      domain: 'Práctica y Agenda',
      business:
        'Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities. Specialized records extend an existing tenant/practice instead of duplicating organization, location, membership, public-profile or authorization data.',
      system:
        'Módulo 22 del modelo: 5 tablas o vistas modeladas y 5 conjuntos de índices.',
      source: 'SALUD/Módulos/M22 organization_extensions.md',
    },
    payments: {
      moduleNumber: 42,
      moduleCode: 'payments',
      title: 'Payment Gateways, Transactions, Refunds and Payouts',
      domain: 'Financiero y ERP',
      business:
        'A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails). Tokenized payment methods (never raw PAN), payment intents tied to invoices/bookings/ad spend, gateway transactions with authorize/capture, refunds, disputes/chargebacks, scheduled payouts to practitioners (CU-18), gateway settlements and signed webhook events. Posts to the general ledger (module 16) and reconciles against billing (module 17) — money never lives only in the gateway.',
      system:
        'Módulo 42 del modelo: 57 tablas o vistas modeladas y 55 conjuntos de índices; depende de 2 módulos y lo referencian 3 módulos.',
      source: 'SALUD/Módulos/M42 payments.md',
    },
    pharmacy: {
      moduleNumber: 24,
      moduleCode: 'pharmacy',
      title: 'Pharmacy Identity, Sites, Catalog and Pricing',
      domain: 'Farmacia',
      business:
        "A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility. It can operate through direct backend integration or manual data entry without sharing unrestricted access to the host organization's data.",
      system:
        'Módulo 24 del modelo: 9 tablas o vistas modeladas y 9 conjuntos de índices.',
      source: 'SALUD/Módulos/M24 pharmacy.md',
    },
    pharmacy_inventory: {
      moduleNumber: 25,
      moduleCode: 'pharmacy_inventory',
      title: 'Pharmacy Inventory, Supply and Dispensing',
      domain: 'Farmacia',
      business:
        'Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations. The immutable ledger is the source of truth; stock positions are transactional projections optimized for reads.',
      system:
        'Módulo 25 del modelo: 19 tablas o vistas modeladas y 19 conjuntos de índices; depende de 2 módulos y lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M25 pharmacy_inventory.md',
    },
    platform: {
      moduleNumber: 0,
      moduleCode: 'platform',
      title: 'SALUD v4.0 — Canonical Platform and Polyglot Data Architecture',
      domain: 'Núcleo y Terminología',
      business: null,
      system: 'Módulo 00 del modelo: 0 tablas o vistas modeladas.',
      source: 'SALUD/Módulos/M00 platform.md',
    },
    platform_ops: {
      moduleNumber: 46,
      moduleCode: 'platform_ops',
      title: 'Platform Operations, Observability and Releases',
      domain: 'Operaciones de Plataforma',
      business:
        "The operational backbone a data-center-grade deployment requires. Governs the platform's tools/technologies and the build/release artifacts they produce, the logical service components that run in each environment, their deployments, and continuous health checks with append-only run history and derived incidents. Complements qa_lab (pre-release testing), telemetry (product analytics) and system_ops (data governance) with runtime operations & SRE evidence. No PHI.",
      system:
        'Módulo 46 del modelo: 38 tablas o vistas modeladas y 38 conjuntos de índices.',
      source: 'SALUD/Módulos/M46 platform_ops.md',
    },
    polyglot_storage: {
      moduleNumber: 54,
      moduleCode: 'polyglot_storage',
      title: 'Polyglot Storage Governance and Data Placement',
      domain: 'Datos y NoSQL',
      business:
        'Defines where each dataset may live, which store is canonical, how tenants are isolated, and which encryption, residency, retention, replication and consistency rules apply. This module is the control plane. It does not move clinical or financial sources of truth away from PostgreSQL.',
      system:
        'Módulo 54 del modelo: 20 tablas o vistas modeladas y 20 conjuntos de índices; depende de 4 módulos y lo referencian 3 módulos.',
      source: 'SALUD/Módulos/M54 polyglot_storage.md',
    },
    portal_catalog: {
      moduleNumber: 34,
      moduleCode: 'portal_catalog',
      title: 'Portal Catalogue and Frontend Navigation',
      domain: 'Marketing y Crecimiento',
      business: null,
      system: 'Módulo 34 del modelo: 0 tablas o vistas modeladas.',
      source: 'SALUD/Módulos/M34 portal_catalog.md',
    },
    practice: {
      moduleNumber: 14,
      moduleCode: 'practice',
      title: 'Care Organizations, Sites, Units, Spaces and Workforce',
      domain: 'Práctica y Agenda',
      business:
        'General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service. Hospitals, diagnostic units and pharmacies receive explicit domain identities in specialized schemas. A site may host them without merging their tenants, credentials or data governance. The model implements Organization + Location + HealthcareService + PractitionerRole semantics without forcing every professional to own a room.',
      system:
        'Módulo 14 del modelo: 11 tablas o vistas modeladas y 11 conjuntos de índices.',
      source: 'SALUD/Módulos/M14 practice.md',
    },
    procedures_perioperative: {
      moduleNumber: 53,
      moduleCode: 'procedures_perioperative',
      title: 'Medical Interventions, Surgery and Perioperative Care',
      domain: 'Clínico y Diagnóstico',
      business:
        'Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up, outcomes and charge linkage.',
      system:
        'Módulo 53 del modelo: 35 tablas o vistas modeladas y 35 conjuntos de índices.',
      source: 'SALUD/Módulos/M53 procedures_perioperative.md',
    },
    profiles: {
      moduleNumber: 5,
      moduleCode: 'profiles',
      title: 'Persons, Patients and Health Workforce',
      domain: 'Núcleo y Terminología',
      business:
        'Separates the human person from login accounts and from domain roles. A person may be a patient, practitioner, related person, representative or operator and may have zero, one or multiple authentication accounts over time. Patient and practitioner records therefore remain valid for newborns, emergencies, imported records, external professionals and deceased persons without portal access.',
      system:
        'Módulo 05 del modelo: 19 tablas o vistas modeladas y 19 conjuntos de índices; lo referencian 5 módulos.',
      source: 'SALUD/Módulos/M05 profiles.md',
    },
    promotions: {
      moduleNumber: 51,
      moduleCode: 'promotions',
      title: 'Loyalty, Discounts, Coupons and Referrals',
      domain: 'Marketing y Crecimiento',
      business:
        'The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking, app-usage rewards (earn points/credits for booking, completing courses, referrals, streaks), and a referral program. Discounts apply at checkout (module 42 payments / 17 billing) and credits settle into wallets (module 42B). Fully auditable; abuse-resistant by construction.',
      system:
        'Módulo 51 del modelo: 11 tablas o vistas modeladas y 11 conjuntos de índices.',
      source: 'SALUD/Módulos/M51 promotions.md',
    },
    qa_execution: {
      moduleNumber: 68,
      moduleCode: 'qa_execution',
      title: 'QA Execution — Server-Side Test Runner with Approved Plans',
      domain: 'Operaciones de Plataforma',
      business:
        'Ejecuta en el servidor las suites que el laboratorio de QA guarda, contra destinos que alguien aprobó de antemano. Una persona pide un plan (suite + ambiente + límites), el plan queda congelado con un hash, otra persona lo aprueba sobre ese hash y recién entonces un worker lo corre; cada paso deja su evento. El navegador pide, aprueba y mira: no ejecuta nada. Los destinos son una lista cerrada con protección contra llamadas hacia redes internas (SSRF), así que un plan no puede apuntar a cualquier dirección. Es lo que permite correr las pruebas por flujo desde el portal de superadministración sin abrir el QA Lab al mundo.',
      system:
        'Módulo 68 del modelo: 4 tablas o vistas modeladas; depende de 2 módulos.',
      source: 'SALUD/Módulos/M68 qa_execution.md',
    },
    qa_lab: {
      moduleNumber: 36,
      moduleCode: 'qa_lab',
      title: 'Quality Assurance Lab and Test Evidence',
      domain: 'Clínico y Diagnóstico',
      business:
        "A governed quality-assurance laboratory for the platform's integrations and critical workflows. Stores reusable test suites and cases, executable runs against named environments, per-case results, and — crucially — the exact request payloads SENT and response payloads RECEIVED for every step, so any integration failure can be reproduced, audited and diffed against the contract in module 12/31.",
      system:
        'Módulo 36 del modelo: 13 tablas o vistas modeladas y 13 conjuntos de índices.',
      source: 'SALUD/Módulos/M36 qa_lab.md',
    },
    read_models: {
      moduleNumber: 30,
      moduleCode: 'read_models',
      title: 'Frontend View Contracts and Read Models',
      domain: 'Auditoría y Reporting',
      business:
        'Provides frontend-ready, permission-aware read contracts. Every page binds to a route, a versioned read model, field metadata, filters, sorting, actions, KPIs and explicit loading/empty/error/forbidden/stale states. Views return display-ready labels and stable codes without exposing ORM models, secrets or unnecessary PHI.',
      system:
        'Módulo 30 del modelo: 86 tablas o vistas modeladas y 17 conjuntos de índices.',
      source: 'SALUD/Módulos/M30 read_models.md',
    },
    redis_runtime: {
      moduleNumber: 56,
      moduleCode: 'redis_runtime',
      title: 'Redis Runtime Cache, Ephemeral Security and Coordination',
      domain: 'Datos y NoSQL',
      business:
        'Contains only reconstructable or explicitly ephemeral state: sessions, challenges, rate limits, locks, caches, presence, job progress and consumer deduplication. Redis is never the sole source for clinical records, balances, stock, contracts, consent evidence or audit history.',
      system:
        'Módulo 56 del modelo: 14 tablas o vistas modeladas y 14 conjuntos de índices; depende de 3 módulos.',
      source: 'SALUD/Módulos/M56 redis_runtime.md',
    },
    reporting: {
      moduleNumber: 39,
      moduleCode: 'reporting',
      title: 'Reporting, Dashboards and Scheduled Distribution',
      domain: 'Auditoría y Reporting',
      business:
        'A configuration-driven reporting engine so the application supports dynamic reports without code changes. Report definitions declare a governed dataset, parameters, columns and output formats; versions are tracked; schedules and subscriptions drive automated execution and distribution; executions capture parameters, row counts and the produced file; dashboards compose reports into visual surfaces. Reads only from governed read models (module 30) — never grants authority.',
      system:
        'Módulo 39 del modelo: 12 tablas o vistas modeladas y 12 conjuntos de índices.',
      source: 'SALUD/Módulos/M39 reporting.md',
    },
    scheduling: {
      moduleNumber: 41,
      moduleCode: 'scheduling',
      title: 'Appointments, Availability, Holds and Waitlists',
      domain: 'Práctica y Agenda',
      business:
        'The full booking (agenda) layer on top of the clinical appointment record. Models bookable resources (practitioners, rooms, equipment), schedule templates and rules that generate slots, availability exceptions, concurrency-safe slot holds (the distributed reservation lock for CU-10), confirmed bookings, reschedules, cancellations with policy-driven fees, waitlists and reminders. The canonical clinical appointment stays in module 08/18; this module owns the reservation lifecycle and anti-double-booking guarantees.',
      system:
        'Módulo 41 del modelo: 16 tablas o vistas modeladas y 17 conjuntos de índices; lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M41 scheduling.md',
    },
    search_platform: {
      moduleNumber: 57,
      moduleCode: 'search_platform',
      title: 'Search and Operational Index Projections',
      domain: 'Datos y NoSQL',
      business:
        'Provides full-text, faceted, geospatial and operational search projections. Search documents are derived copies, never the authoritative source. Clinical search uses preauthorized, redacted projections with tenant, patient, purpose-of-use and principal filters.',
      system:
        'Módulo 57 del modelo: 13 tablas o vistas modeladas y 13 conjuntos de índices; depende de 3 módulos.',
      source: 'SALUD/Módulos/M57 search_platform.md',
    },
    system_context: {
      moduleNumber: 45,
      moduleCode: 'system_context',
      title: 'System Context and Dynamic Enumerations',
      domain: 'Núcleo y Terminología',
      business:
        'Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets. Consumers receive reproducible context instead of ad-hoc JSON or hard-coded lists.',
      system:
        'Módulo 45 del modelo: 9 tablas o vistas modeladas y 9 conjuntos de índices.',
      source: 'SALUD/Módulos/M45 system_context.md',
    },
    system_ops: {
      moduleNumber: 11,
      moduleCode: 'system_ops',
      title: 'Data Governance and System Operations',
      domain: 'Operaciones de Plataforma',
      business:
        'A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store. Turns governance from policy into enforced practice.',
      system:
        'Módulo 11 del modelo: 29 tablas o vistas modeladas y 29 conjuntos de índices; lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M11 system_ops.md',
    },
    telemetry: {
      moduleNumber: 28,
      moduleCode: 'telemetry',
      title: 'User Activity, Consent-Aware Tracking and Analytics',
      domain: 'Operaciones de Plataforma',
      business:
        'Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics. Terms acceptance is evidence of disclosure, not a universal legal basis.',
      system:
        'Módulo 28 del modelo: 14 tablas o vistas modeladas y 14 conjuntos de índices.',
      source: 'SALUD/Módulos/M28 telemetry.md',
    },
    terminology: {
      moduleNumber: 3,
      moduleCode: 'terminology',
      title: 'Terminology, Value Sets and Dynamic Catalogs',
      domain: 'Núcleo y Terminología',
      business:
        'A governed engine for every coded value the platform uses (diagnoses, statuses, units, roles...) based on international standards (SNOMED, LOINC, ICD, ATC, UCUM) plus local catalogs. It makes the system multilingual, interoperable and future-proof: new values are added without software changes.',
      system:
        'Módulo 03 del modelo: 15 tablas o vistas modeladas y 15 conjuntos de índices.',
      source: 'SALUD/Módulos/M03 terminology.md',
    },
    time_series: {
      moduleNumber: 58,
      moduleCode: 'time_series',
      title: 'High-Volume Time Series and Event Analytics',
      domain: 'Datos y NoSQL',
      business:
        'Stores high-frequency readings and operational events that would overload transactional tables. Only validated and clinically meaningful summaries are promoted into PostgreSQL clinical.observations.',
      system:
        'Módulo 58 del modelo: 12 tablas o vistas modeladas y 12 conjuntos de índices; depende de 2 módulos.',
      source: 'SALUD/Módulos/M58 time_series.md',
    },
    tracking: {
      moduleNumber: 37,
      moduleCode: 'tracking',
      title: 'Shipments, Milestones and Status Timelines',
      domain: 'Integraciones y Contratos',
      business:
        'Business-level tracking of anything that moves or progresses: pharmacy deliveries, lab specimen transport, ambulance dispatch, referral fulfilment, claim processing. Provides a generic trackable subject with a tracking number, a status timeline of milestones, carrier/handoff records, ETA estimates and proof-of-delivery. Consumes raw GPS from module 13 (geo) but adds the business meaning geo does not carry.',
      system:
        'Módulo 37 del modelo: 8 tablas o vistas modeladas y 8 conjuntos de índices.',
      source: 'SALUD/Módulos/M37 tracking.md',
    },
    vector_rag: {
      moduleNumber: 59,
      moduleCode: 'vector_rag',
      title: 'Vector Search, RAG Evidence and Embedding Governance',
      domain: 'Datos y NoSQL',
      business:
        'Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts. Embeddings are derived data. Source documents, consent, access policies and deletion propagation remain authoritative elsewhere.',
      system:
        'Módulo 59 del modelo: 14 tablas o vistas modeladas y 14 conjuntos de índices; depende de 2 módulos.',
      source: 'SALUD/Módulos/M59 vector_rag.md',
    },
    workflow: {
      moduleNumber: 32,
      moduleCode: 'workflow',
      title: 'State Machines and Cross-Domain Workflows',
      domain: 'Operaciones de Plataforma',
      business:
        'Makes lifecycle rules executable and auditable. State codes remain governed terminology concepts, while this module defines initial/terminal states, allowed transitions, actor permissions, guards, idempotency, side effects and immutable transition evidence for critical aggregates.',
      system:
        'Módulo 32 del modelo: 17 tablas o vistas modeladas y 8 conjuntos de índices; lo referencian 1 módulo.',
      source: 'SALUD/Módulos/M32 workflow.md',
    },
  };
