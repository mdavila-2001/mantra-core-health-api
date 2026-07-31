# Actores y roles

> Fase 9. **120 códigos de rol** distintos, extraídos de todos los usos reales de `@Roles(...)`
> en el código (`grep -rhoE "@Roles\('[^)]+\)" src/modules`), no de un documento de diseño
> aparte — si un rol no se usa en ningún `@Roles(...)`, no aparece aquí. Agrupados por área
> funcional para lectura; el código fuente es la lista canónica.

## Comodín de privilegio total

`SUPERADMIN` evita enumerar cada rol en cada endpoint administrativo — un usuario con este rol
pasa cualquier chequeo de `RolesGuard` (ver [autorización](../api/authorization.md)). Es el rol de
mayor impacto de todo el sistema: comprometerlo equivale a comprometer el RBAC completo.

## Actores clínicos y asistenciales

`CLINICIAN`, `PRACTITIONER`, `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `PERIOP_ADMIN`,
`SURGERY_SCHEDULER`, `CLINICAL_APPROVER`, `CLINICAL_INFORMATICIAN`, `PRINCIPAL_INVESTIGATOR`.
Estos son los actores sujetos al **PDP clínico aditivo**: el rol por sí solo no concede acceso a
PHI, se exige además alcance clínico vigente (relación asistencial, consentimiento, grant) — ver
[autorización](../api/authorization.md) §"PDP clínico aditivo".

## Paciente y representación

`PATIENT`, `MEMBER`. El acceso de un paciente a sus propios datos, y el de un representante legal
(tutor, apoderado) vía `PatientLegalRepresentationsRepository`, siguen reglas de alcance propias
dentro del mismo PDP clínico.

## Financiero y facturación

`ACCOUNTANT`, `ACCOUNTING_APPROVER`, `ACCOUNTS_PAYABLE`, `BILLING`, `BILLING_AGENT`,
`CASHIER`, `FINANCE`, `FINOPS_ANALYST`, `PAYMENTS_ADMIN`, `CONTRACT_MANAGER`, `BUYER`, `SALES`.

## Cadena de suministro / operación de práctica

`WAREHOUSE`, `LOGISTICS_OPERATOR`, `COURIER`, `MAINTENANCE_WORKER`, `SCHEDULER`,
`SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `CAPACITY_PLANNER`.

## Gobierno, cumplimiento y privacidad

`COMPLIANCE_OFFICER`, `DATA_GOVERNANCE_ADMIN`, `DATA_PRIVACY_OFFICER`, `DPO`, `PRIVACY_OFFICER`,
`LEGAL_COUNSEL`, `POLICY_REVIEWER`, `GOVERNANCE`, `GOVERNANCE_ADMIN`, `RESEARCH_GOVERNANCE`,
`AI_GOVERNANCE_OFFICER`, `AUDITOR`, `QUALITY_REVIEWER`, `INCIDENT_COMMANDER`,
`CHANGE_APPROVER`, `RELEASE_MANAGER`, `OPERATIONAL_APPROVER`.

## Plataforma, datos e infraestructura (roles técnicos operativos)

`PLATFORM_ADMIN`, `PLATFORM_OPERATOR`, `SRE`, `SECURITY_ADMIN`, `IDENTITY_ADMIN`,
`DATA_PLATFORM_ADMIN`, `DATA_PLATFORM_ENGINEER`, `DATA_PRODUCT_OWNER`, `DATA_STEWARD`,
`MPI_STEWARD`, `STORAGE_ADMIN`, `STORAGE_CLIENT`, `MESSAGING_ADMIN`, `SEARCH_ADMIN`,
`SEARCH_READER`, `TRACKING_ADMIN`, `REPORTING_ADMIN`, `HEALTH_DATA_ADMIN`, `ERP_ADMIN`,
`CRM_ADMIN`, `EDUCATION_ADMIN`, `PROMOTIONS_ADMIN`, `ADS_ADMIN`, `RAG_COLLECTION_ADMIN`,
`SOURCE_ADMIN`, `MODULE_OWNER`, `WORKFLOW_ARCHITECT`, `AUTOMATION_ENGINEER`, `MLOPS_ENGINEER`,
`TERMINOLOGY_ENGINEER`, `QA_ADMIN`, `QA_ENGINEER`, `GRAPH_ANALYST`, `ANALYST`, `REPORT_AUTHOR`,
`REPORT_VIEWER`, `CONTENT_EDITOR`, `COURSE_AUTHOR`, `LEARNER`, `CONTEXT_CONSUMER`,
`CONTEXT_CURATOR`, `INTEROP_CONSUMER`, `CRM_AGENT`, `MARKETING_MANAGER`, `HR_ADMIN`,
`BUSINESS_ADMIN`, `EMPLOYEE`, `USER`.

## Sujetos de servicio-a-servicio (no humanos)

Roles asignados a llamadas internas (workers, integraciones, sistemas), no a personas:
`SYSTEM`, `SYSTEM_WORKER`, `AUTH_SERVICE`, `WRITE_SERVICE`, `AGENT_RUNTIME`, `DEVICE`,
`DEPLOY_PIPELINE`, `INGEST_GATEWAY`, `PACS_GATEWAY`, `DICOM_VIEWER`, `SAGA_ORCHESTRATOR`,
`DEIDENTIFICATION_WORKER`, `DELETION_WORKER`, `EMBEDDING_WORKER`, `INGESTION_WORKER`,
`PROJECTION_WORKER`, `GRAPH_ANALYTICS_WORKER`, `GRAPH_PROJECTION_WORKER`,
`RECONCILIATION_WORKER`, `RETRIEVAL_WORKER`, `TRANSFORMATION_WORKER`.

Esta categoría es relevante para el modelo de amenazas (Fase 13): son credenciales de proceso,
no de usuario final, con su propio ciclo de vida y rotación — ver
`docs/security/secrets-management.md` cuando exista.

## Cómo se asigna un rol

`UserRoleAssignmentsRepository` (módulo `authz`) — asignación por usuario, con posible expiración
y excepciones. `UserGlobalRoles` (módulo `iam`) es la entidad de asignación global observada en el
grafo de dependencias (`docs/reports/graphify-audit.md` §9, "Surprising Connections").
