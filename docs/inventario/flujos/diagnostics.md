<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `diagnostics`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 27 (23 con decisiones propias, 4 sin ellas)
- Inventario de endpoints del módulo: [diagnostics](../endpoints/diagnostics.md)

## Proceso: Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica

- **Código:** `diagnostics` · **Agrupación:** MIXTO · **Operaciones:** 27
- **Actores:** CLINICIAN · PATIENT · PRACTITIONER
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/diagnostics/README.md`

### Para qué sirve

Implementa los 14 casos de uso del módulo 20 más 4 endpoints de soporte (altas de padres que el módulo no expone como UC pero que los flujos necesitan). Sigue el patrón de capas de `iam`: controladores finos → servicios con la unidad de trabajo (`em.transactional`) → repositorios stateless (reciben el `EntityManager`).

_Fuente: `src/modules/diagnostics/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-20-01` | Acesionar especímenes recibidos | POST /diagnostics/accessions | CLINICIAN · PRACTITIONER | MEDIO | 5 |
| `UC-20-02` | Rechazar espécimen y solicitar recolección | POST /diagnostics/specimens/{id}/rejection | CLINICIAN · PRACTITIONER | MEDIO | 4 |
| `UC-20-03` | Cadena de custodia / traslado | POST /diagnostics/containers/{id}/custody-events | CLINICIAN · PRACTITIONER | MEDIO | 4 |
| `UC-20-04` | Abrir orden de trabajo y desglosar pruebas | POST /diagnostics/work-orders | CLINICIAN · PRACTITIONER | MEDIO | 4 |
| `UC-20-05` | Ingerir mensaje de resultado (LIS/HL7/ASTM) | POST /diagnostics/analyzer-runs/{id}/messages | CLINICIAN · PRACTITIONER | MEDIO | 5 |
| `UC-20-06` | Verificar (técnica/facultativa) | POST /diagnostics/results/{observationId}/verifications | CLINICIAN · PRACTITIONER | MEDIO | 2 |
| `UC-20-07` | Crear/enmendar versión de informe | POST /diagnostics/reports/{reportId}/versions | CLINICIAN · PRACTITIONER | MEDIO | 4 |
| `UC-20-08` | Validar y liberar | POST /diagnostics/reports/{reportId}/versions/{versionId}/release | CLINICIAN · PRACTITIONER | MEDIO | 5 |
| `UC-20-09` | Detectar y notificar resultado crítico | POST /diagnostics/critical-results | CLINICIAN · PRACTITIONER | MEDIO | 2 |
| `UC-20-10` | Acusar recibo / escalar | POST /diagnostics/critical-results/{id}/acknowledge | CLINICIAN · PRACTITIONER | MEDIO | 2 |
| `UC-20-11` | Ingestar estudio DICOM (STOW-RS) | POST /dicomweb/studies | CLINICIAN · PRACTITIONER | MEDIO | 6 |
| `UC-20-12` | Adjuntar media clínica / imagen | POST /diagnostics/clinical-media | CLINICIAN · PRACTITIONER | MEDIO | 3 |
| `UC-20-13` | Registrar dosis de radiación | POST /diagnostics/imaging-studies/{id}/dose-events | CLINICIAN · PRACTITIONER | MEDIO | 2 |
| `UC-20-14` | Evento de calidad de datos + provenance | POST /diagnostics/data-quality-events | CLINICIAN · PRACTITIONER | MEDIO | 2 |
| `ctrl:DiagnosticsImagingController` | Operaciones de DiagnosticsImagingController que el README no asigna a un caso de uso | POST /diagnostics/imaging-endpoints | CLINICIAN · PRACTITIONER | MEDIO | 1 |
|  |  | GET /diagnostics/patients/{patientProfileId}/imaging-studies | CLINICIAN · PRACTITIONER | BAJO | 1 |
| `ctrl:DiagnosticsLabController` | Operaciones de DiagnosticsLabController que el README no asigna a un caso de uso | POST /diagnostics/analyzer-runs | CLINICIAN · PRACTITIONER | MEDIO | 1 |
|  |  | GET /diagnostics/work-orders | CLINICIAN · PRACTITIONER | BAJO | 1 |
| `ctrl:DiagnosticsOrdersController` | Operaciones de DiagnosticsOrdersController que el README no asigna a un caso de uso | GET /diagnostics/patients/{patientProfileId}/orders | CLINICIAN · PRACTITIONER | BAJO | 2 |
| `ctrl:DiagnosticsPatientResultsController` | Operaciones de DiagnosticsPatientResultsController que el README no asigna a un caso de uso | GET /diagnostic-results/me | PATIENT | BAJO | 7 |
|  |  | GET /diagnostic-results/me/{reportId} | PATIENT | BAJO | 7 |
|  |  | GET /diagnostic-results/me/{reportId}/shares | PATIENT | BAJO | 4 |
|  |  | POST /diagnostic-results/me/{reportId}/shares | PATIENT | MEDIO | 10 |
|  |  | POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke | PATIENT | MEDIO | 5 |
|  |  | GET /diagnostic-results/me/orders | PATIENT | BAJO | 9 |
| `ctrl:DiagnosticsSpecimensController` | Operaciones de DiagnosticsSpecimensController que el README no asigna a un caso de uso | POST /diagnostics/specimens | CLINICIAN · PRACTITIONER | MEDIO | 1 |
|  |  | POST /diagnostics/specimens/{id}/containers | CLINICIAN · PRACTITIONER | MEDIO | 2 |

### Diagrama 1 de 2 — etapas `UC-20-01`, `UC-20-02`, `UC-20-03`…

```mermaid
flowchart LR
  a2(["CLINICIAN · PRACTITIONER"]):::actor
  t3[("diagnostics.accession_specimens")]:::tabla
  t4[("diagnostics.laboratory_accessions")]:::tabla
  t5[("diagnostics.specimen_chain_of_custody_events")]:::tabla
  t6[("diagnostics.specimens")]:::tabla
  t8[("diagnostics.laboratory_work_order_tests")]:::tabla
  t9[("diagnostics.specimen_rejection_events")]:::tabla
  t11[("diagnostics.specimen_container_events")]:::tabla
  t12[("diagnostics.specimen_containers")]:::tabla
  t14[("diagnostics.laboratory_work_orders")]:::tabla
  t16[("diagnostics.analyzer_result_messages")]:::tabla
  t17[("diagnostics.analyzer_runs")]:::tabla
  t19[("diagnostics.result_verifications")]:::tabla
  t21[("diagnostics.diagnostic_report_files")]:::tabla
  t22[("diagnostics.diagnostic_report_results")]:::tabla
  t23[("diagnostics.diagnostic_report_versions")]:::tabla
  t25[("clinical.diagnostic_reports")]:::tabla
  t26[("diagnostics.diagnostic_release_events")]:::tabla
  t28[("diagnostics.critical_result_notifications")]:::tabla
  t31[("diagnostics.dicom_object_locations")]:::tabla
  t32[("diagnostics.imaging_endpoints")]:::tabla
  t33[("diagnostics.imaging_instances")]:::tabla
  t34[("diagnostics.imaging_series")]:::tabla
  t35[("diagnostics.imaging_studies")]:::tabla
  t37[("diagnostics.clinical_media")]:::tabla
  t38[("diagnostics.media_annotations")]:::tabla
  t40[("diagnostics.radiation_dose_events")]:::tabla
  t42[("diagnostics.diagnostic_data_quality_events")]:::tabla
  t43[("diagnostics.diagnostic_provenance_links")]:::tabla
  subgraph s0["UC-20-01 · Acesionar especímenes recibidos"]
    o1["POST /diagnostics/accessions"]:::op
  end
  subgraph s1["UC-20-02 · Rechazar espécimen y solicitar recolección"]
    o7["POST /diagnostics/specimens/{id}/rejection"]:::op
  end
  subgraph s2["UC-20-03 · Cadena de custodia / traslado"]
    o10["POST /diagnostics/containers/{id}/custody-events"]:::op
  end
  subgraph s3["UC-20-04 · Abrir orden de trabajo y desglosar pruebas"]
    o13["POST /diagnostics/work-orders"]:::op
  end
  subgraph s4["UC-20-05 · Ingerir mensaje de resultado (LIS/HL7/ASTM)"]
    o15["POST /diagnostics/analyzer-runs/{id}/messages"]:::op
  end
  subgraph s5["UC-20-06 · Verificar (técnica/facultativa)"]
    o18["POST /diagnostics/results/{observationId}/verifications"]:::op
  end
  subgraph s6["UC-20-07 · Crear/enmendar versión de informe"]
    o20["POST /diagnostics/reports/{reportId}/versions"]:::op
  end
  subgraph s7["UC-20-08 · Validar y liberar"]
    o24["POST /diagnostics/reports/{reportId}/versions/{versionId}/release"]:::op
  end
  subgraph s8["UC-20-09 · Detectar y notificar resultado crítico"]
    o27["POST /diagnostics/critical-results"]:::op
  end
  subgraph s9["UC-20-10 · Acusar recibo / escalar"]
    o29["POST /diagnostics/critical-results/{id}/acknowledge"]:::op
  end
  subgraph s10["UC-20-11 · Ingestar estudio DICOM (STOW-RS)"]
    o30["POST /dicomweb/studies"]:::op
  end
  subgraph s11["UC-20-12 · Adjuntar media clínica / imagen"]
    o36["POST /diagnostics/clinical-media"]:::op
  end
  subgraph s12["UC-20-13 · Registrar dosis de radiación"]
    o39["POST /diagnostics/imaging-studies/{id}/dose-events"]:::op
  end
  subgraph s13["UC-20-14 · Evento de calidad de datos + provenance"]
    o41["POST /diagnostics/data-quality-events"]:::op
  end
  subgraph s14["ctrl:DiagnosticsImagingController · Operaciones de DiagnosticsImagingController…"]
    o44["POST /diagnostics/imaging-endpoints"]:::op
    o45["GET /diagnostics/patients/{patientProfileId}/imaging-studies"]:::op
  end
  subgraph s15["ctrl:DiagnosticsLabController · Operaciones de DiagnosticsLabController que el…"]
    o46["POST /diagnostics/analyzer-runs"]:::op
    o47["GET /diagnostics/work-orders"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"ACTUALIZA"| t6
  o1 -->|"LEE"| t6
  a2 --> o7
  o7 -->|"ACTUALIZA"| t8
  o7 -->|"CREA"| t9
  o7 -->|"ACTUALIZA"| t6
  o7 -->|"LEE"| t6
  a2 --> o10
  o10 -->|"CREA"| t5
  o10 -->|"CREA"| t11
  o10 -->|"ACTUALIZA"| t12
  o10 -->|"LEE"| t12
  a2 --> o13
  o13 -->|"ACTUALIZA"| t4
  o13 -->|"LEE"| t4
  o13 -->|"CREA"| t8
  o13 -->|"CREA"| t14
  a2 --> o15
  o15 -->|"CREA"| t16
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t17
  o15 -->|"ACTUALIZA"| t8
  o15 -->|"LEE"| t8
  a2 --> o18
  o18 -->|"ACTUALIZA"| t8
  o18 -->|"CREA"| t19
  a2 --> o20
  o20 -->|"CREA"| t21
  o20 -->|"CREA"| t22
  o20 -->|"CREA"| t23
  o20 -->|"LEE"| t23
  a2 --> o24
  o24 -->|"ACTUALIZA"| t25
  o24 -->|"LEE"| t25
  o24 -->|"CREA"| t26
  o24 -->|"ACTUALIZA"| t23
  o24 -->|"LEE"| t23
  a2 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t28
  a2 --> o29
  o29 -->|"ACTUALIZA"| t28
  o29 -->|"LEE"| t28
  a2 --> o30
  o30 -->|"CREA"| t31
  o30 -->|"LEE"| t32
  o30 -->|"CREA"| t33
  o30 -->|"CREA"| t34
  o30 -->|"CREA"| t35
  o30 -->|"LEE"| t35
  a2 --> o36
  o36 -->|"CREA"| t37
  o36 -->|"LEE"| t37
  o36 -->|"CREA"| t38
  a2 --> o39
  o39 -->|"LEE"| t35
  o39 -->|"CREA"| t40
  a2 --> o41
  o41 -->|"CREA"| t42
  o41 -->|"CREA"| t43
  a2 --> o44
  o44 -->|"CREA"| t32
  a2 --> o45
  o45 -->|"LEE"| t35
  a2 --> o46
  o46 -->|"CREA"| t17
  a2 --> o47
  o47 -->|"LEE"| t14
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:DiagnosticsOrdersController`, `ctrl:DiagnosticsPatientResultsController`, `ctrl:DiagnosticsSpecimensController`

```mermaid
flowchart LR
  a2(["CLINICIAN · PRACTITIONER"]):::actor
  a6(["PATIENT"]):::actor
  t3[("clinical.diagnostic_reports")]:::tabla
  t4[("clinical.service_requests")]:::tabla
  t7[("diagnostics.diagnostic_release_events")]:::tabla
  t8[("diagnostics.diagnostic_report_files")]:::tabla
  t9[("diagnostics.diagnostic_report_results")]:::tabla
  t10[("diagnostics.diagnostic_report_versions")]:::tabla
  t11[("profiles.patient_profiles")]:::tabla
  t16[("authz.resource_scope_grants")]:::tabla
  t17[("profiles.person_account_links")]:::tabla
  t22[("diagnostic_units.diagnostic_study_offerings")]:::tabla
  t25[("diagnostics.specimens")]:::tabla
  t27[("diagnostics.specimen_containers")]:::tabla
  subgraph s0["ctrl:DiagnosticsOrdersController · Operaciones de DiagnosticsOrdersController q…"]
    o1["GET /diagnostics/patients/{patientProfileId}/orders"]:::op
  end
  t12[("+1 tablas más")]
  t14[("+1 tablas más")]
  t19[("+4 tablas más")]
  t23[("+3 tablas más")]
  subgraph s1["ctrl:DiagnosticsPatientResultsController · Operaciones de DiagnosticsPatientRes…"]
    o5["GET /diagnostic-results/me"]:::op
    o13["GET /diagnostic-results/me/{reportId}"]:::op
    o15["GET /diagnostic-results/me/{reportId}/shares"]:::op
    o18["POST /diagnostic-results/me/{reportId}/shares"]:::op
    o20["POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke"]:::op
    o21["GET /diagnostic-results/me/orders"]:::op
  end
  subgraph s2["ctrl:DiagnosticsSpecimensController · Operaciones de DiagnosticsSpecimensContro…"]
    o24["POST /diagnostics/specimens"]:::op
    o26["POST /diagnostics/specimens/{id}/containers"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a6 --> o5
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t7
  o5 -->|"LEE"| t8
  o5 -->|"LEE"| t9
  o5 -->|"LEE"| t10
  o5 -->|"LEE"| t11
  o5 -.-> t12
  a6 --> o13
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t7
  o13 -->|"LEE"| t8
  o13 -->|"LEE"| t9
  o13 -->|"LEE"| t10
  o13 -->|"LEE"| t11
  o13 -.-> t14
  a6 --> o15
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t3
  o15 -->|"LEE"| t11
  o15 -->|"LEE"| t17
  a6 --> o18
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"CREA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"LEE"| t3
  o18 -->|"LEE"| t7
  o18 -->|"LEE"| t8
  o18 -.-> t19
  a6 --> o20
  o20 -->|"ACTUALIZA"| t16
  o20 -->|"LEE"| t16
  o20 -->|"LEE"| t3
  o20 -->|"LEE"| t11
  o20 -->|"LEE"| t17
  a6 --> o21
  o21 -->|"LEE"| t3
  o21 -->|"LEE"| t4
  o21 -->|"LEE"| t22
  o21 -->|"LEE"| t7
  o21 -->|"LEE"| t8
  o21 -->|"LEE"| t9
  o21 -.-> t23
  a2 --> o24
  o24 -->|"CREA"| t25
  a2 --> o26
  o26 -->|"CREA"| t27
  o26 -->|"LEE"| t25
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /diagnostic-results/me

Resultados de laboratorio, informes e imagen del titular

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.listOwnResults"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7{"!link"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PatientProfilesRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE profiles.patient_profiles")]:::efecto
  n9 --> n10
  n11{"!patient"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticOrdersRepository.findReportsForPatientPortal"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE clinical.diagnostic_reports")]:::efecto
  n13 --> n14
  n15["Llama a DiagnosticsPatientResultsService.projectReleasedResults"]:::llamada
  n14 --> n15
  n16["Llama a ReportsRepository.findVersionsByReports"]:::llamada
  n15 --> n16
  n17[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n16 --> n17
  n18["Llama a ReportsRepository.findReleaseEventsByVersions"]:::llamada
  n17 --> n18
  n19[("LEE diagnostics.diagnostic_release_events")]:::efecto
  n18 --> n19
  n20["Llama a ReportsRepository.findFilesByVersions"]:::llamada
  n19 --> n20
  n21[("LEE diagnostics.diagnostic_report_files")]:::efecto
  n20 --> n21
  n22["Llama a ReportsRepository.findResultsByVersions"]:::llamada
  n21 --> n22
  n23[("LEE diagnostics.diagnostic_report_results")]:::efecto
  n22 --> n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /diagnostic-results/me/{reportId}

Un resultado del titular, con sus archivos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado; ResourceNotFoundException: El resultado todavía no está disponible |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.getOwnResult"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticsPatientResultsService.requireOwnReport"]:::llamada
  n3 --> n4
  n5["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n4 --> n5
  n6["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n5 --> n6
  n7[("LEE profiles.person_account_links")]:::efecto
  n6 --> n7
  n8{"!link"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a PatientProfilesRepository.findById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE profiles.patient_profiles")]:::efecto
  n10 --> n11
  n12{"!patient"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n12 -->|"sí"| n13
  n14["Llama a DiagnosticOrdersRepository.findReportById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE clinical.diagnostic_reports")]:::efecto
  n14 --> n15
  n16{"!report"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Informe no encontrado"]):::error
  n16 -->|"sí"| n17
  n18{"report.patientProfileId !== patientProfileId"}:::decision
  n16 -->|"no"| n18
  n19(["401 UNAUTHENTICATED El informe no pertenece a esta cuenta"]):::error
  n18 -->|"sí"| n19
  n20["Llama a DiagnosticsPatientResultsService.projectReleasedResults"]:::llamada
  n18 -->|"no"| n20
  n21["Llama a ReportsRepository.findVersionsByReports"]:::llamada
  n20 --> n21
  n22[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n21 --> n22
  n23["Llama a ReportsRepository.findReleaseEventsByVersions"]:::llamada
  n22 --> n23
  n24[("LEE diagnostics.diagnostic_release_events")]:::efecto
  n23 --> n24
  n25["Llama a ReportsRepository.findFilesByVersions"]:::llamada
  n24 --> n25
  n26[("LEE diagnostics.diagnostic_report_files")]:::efecto
  n25 --> n26
  n27["Llama a ReportsRepository.findResultsByVersions"]:::llamada
  n26 --> n27
  n28[("LEE diagnostics.diagnostic_report_results")]:::efecto
  n27 --> n28
  n29{"!item"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND El resultado todavía no está disponible"]):::error
  n29 -->|"sí"| n30
  n31(("200 Responde con éxito")):::ok
  n29 -->|"no"| n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /diagnostic-results/me/{reportId}/shares

Con quién está compartido un resultado

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.listOwnResultShares"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticsPatientResultsService.requireOwnReport"]:::llamada
  n3 --> n4
  n5["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n4 --> n5
  n6["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n5 --> n6
  n7[("LEE profiles.person_account_links")]:::efecto
  n6 --> n7
  n8{"!link"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a PatientProfilesRepository.findById"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE profiles.patient_profiles")]:::efecto
  n10 --> n11
  n12{"!patient"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n12 -->|"sí"| n13
  n14["Llama a DiagnosticOrdersRepository.findReportById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE clinical.diagnostic_reports")]:::efecto
  n14 --> n15
  n16{"!report"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Informe no encontrado"]):::error
  n16 -->|"sí"| n17
  n18{"report.patientProfileId !== patientProfileId"}:::decision
  n16 -->|"no"| n18
  n19(["401 UNAUTHENTICATED El informe no pertenece a esta cuenta"]):::error
  n18 -->|"sí"| n19
  n20["Llama a ResourceScopeGrantsRepository.findForResource"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE authz.resource_scope_grants")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /diagnostic-results/me/{reportId}/shares

Compartir temporalmente un resultado con un profesional

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El vencimiento del acceso compartido tiene que ser futuro; PreconditionFailedException: No hace falta compartirse un resultado con uno mismo; PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Sólo se puede compartir un resultado ya liberado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.shareOwnResult"]:::llamada
  n2 --> n3
  n4{"dto.validUntil.getTime() ‹= now.getTime()"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El vencimiento del acceso compartido tiene que ser futuro"]):::error
  n4 -->|"sí"| n5
  n6{"dto.practitionerUserId === actor.id"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED No hace falta compartirse un resultado con uno mismo"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a DiagnosticsPatientResultsService.requireOwnReport"]:::llamada
  n8 --> n9
  n10["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n9 --> n10
  n11["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n10 --> n11
  n12[("LEE profiles.person_account_links")]:::efecto
  n11 --> n12
  n13{"!link"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n13 -->|"sí"| n14
  n15["Llama a PatientProfilesRepository.findById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE profiles.patient_profiles")]:::efecto
  n15 --> n16
  n17{"!patient"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n17 -->|"sí"| n18
  n19["Llama a DiagnosticOrdersRepository.findReportById"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE clinical.diagnostic_reports")]:::efecto
  n19 --> n20
  n21{"!report"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Informe no encontrado"]):::error
  n21 -->|"sí"| n22
  n23{"report.patientProfileId !== patientProfileId"}:::decision
  n21 -->|"no"| n23
  n24(["401 UNAUTHENTICATED El informe no pertenece a esta cuenta"]):::error
  n23 -->|"sí"| n24
  n25["Llama a DiagnosticsPatientResultsService.projectReleasedResults"]:::llamada
  n23 -->|"no"| n25
  n26["Llama a ReportsRepository.findVersionsByReports"]:::llamada
  n25 --> n26
  n27[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n26 --> n27
  n28["Llama a ReportsRepository.findReleaseEventsByVersions"]:::llamada
  n27 --> n28
  n29[("LEE diagnostics.diagnostic_release_events")]:::efecto
  n28 --> n29
  n30["Llama a ReportsRepository.findFilesByVersions"]:::llamada
  n29 --> n30
  n31[("LEE diagnostics.diagnostic_report_files")]:::efecto
  n30 --> n31
  n32["Llama a ReportsRepository.findResultsByVersions"]:::llamada
  n31 --> n32
  n33[("LEE diagnostics.diagnostic_report_results")]:::efecto
  n32 --> n33
  n34{"!visible"}:::decision
  n33 --> n34
  n35(["422 PRECONDITION_FAILED Sólo se puede compartir un resultado ya liberado"]):::error
  n34 -->|"sí"| n35
  n36["Llama a ResourceScopeGrantsRepository.findExisting"]:::llamada
  n34 -->|"no"| n36
  n37[("LEE authz.resource_scope_grants")]:::efecto
  n36 --> n37
  n38{"existing"}:::decision
  n37 --> n38
  n39[("ACTUALIZA authz.resource_scope_grants · ACTUALIZA authz.resource_scope_grants")]:::efecto
  n38 -->|"sí"| n39
  n40["Llama a ResourceScopeGrantsRepository.create"]:::llamada
  n39 --> n40
  n38 -->|"no"| n40
  n41[("CREA authz.resource_scope_grants")]:::efecto
  n40 --> n41
  n42(("201 Responde con éxito")):::ok
  n41 --> n42
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke

Dejar de compartir un resultado

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado; ResourceNotFoundException: Ese resultado no está compartido así |
| 409 | `CONFLICT` | ConflictException: Ese acceso compartido ya estaba cerrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.revokeOwnResultShare"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticsPatientResultsService.requireOwnReport"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n5 --> n6
  n7["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n6 --> n7
  n8[("LEE profiles.person_account_links")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PatientProfilesRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE profiles.patient_profiles")]:::efecto
  n11 --> n12
  n13{"!patient"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n13 -->|"sí"| n14
  n15["Llama a DiagnosticOrdersRepository.findReportById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE clinical.diagnostic_reports")]:::efecto
  n15 --> n16
  n17{"!report"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Informe no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"report.patientProfileId !== patientProfileId"}:::decision
  n17 -->|"no"| n19
  n20(["401 UNAUTHENTICATED El informe no pertenece a esta cuenta"]):::error
  n19 -->|"sí"| n20
  n21["Llama a ResourceScopeGrantsRepository.findByIdForResource"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE authz.resource_scope_grants")]:::efecto
  n21 --> n22
  n23{"!grant || grant.permissionId !== RESULT_READ_PERMISSION_ID"}:::decision
  n22 --> n23
  n24(["404 NOT_FOUND Ese resultado no está compartido así"]):::error
  n23 -->|"sí"| n24
  n25{"grant.validTo !== undefined && grant.validTo.getTime() ‹= now.getTime()"}:::decision
  n23 -->|"no"| n25
  n26(["409 CONFLICT Ese acceso compartido ya estaba cerrado"]):::error
  n25 -->|"sí"| n26
  n27[("ACTUALIZA authz.resource_scope_grants")]:::efecto
  n25 -->|"no"| n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /diagnostic-results/me/orders

Órdenes de laboratorio e imagen del titular

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsPatientResultsService.listOwnOrders"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticsPatientResultsService.resolveOwnPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7{"!link"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La cuenta no tiene una persona vinculada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PatientProfilesRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE profiles.patient_profiles")]:::efecto
  n9 --> n10
  n11{"!patient"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La cuenta no tiene perfil de paciente"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticOrdersRepository.findOrdersForPatientPortal"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE clinical.service_requests")]:::efecto
  n13 --> n14
  n15["Llama a DiagnosticsPatientResultsService.preparacionPorConcepto"]:::llamada
  n14 --> n15
  n16["Llama a DiagnosticOrdersRepository.findPreparationByStudyConcepts"]:::llamada
  n15 --> n16
  n17[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n16 --> n17
  n18["Llama a DiagnosticsPatientResultsService.informeLiberadoPorOrden"]:::llamada
  n17 --> n18
  n19["Llama a DiagnosticOrdersRepository.findReportsByServiceRequests"]:::llamada
  n18 --> n19
  n20[("LEE clinical.diagnostic_reports")]:::efecto
  n19 --> n20
  n21["Llama a DiagnosticsPatientResultsService.projectReleasedResults"]:::llamada
  n20 --> n21
  n22["Llama a ReportsRepository.findVersionsByReports"]:::llamada
  n21 --> n22
  n23[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n22 --> n23
  n24["Llama a ReportsRepository.findReleaseEventsByVersions"]:::llamada
  n23 --> n24
  n25[("LEE diagnostics.diagnostic_release_events")]:::efecto
  n24 --> n25
  n26["Llama a ReportsRepository.findFilesByVersions"]:::llamada
  n25 --> n26
  n27[("LEE diagnostics.diagnostic_report_files")]:::efecto
  n26 --> n27
  n28["Llama a ReportsRepository.findResultsByVersions"]:::llamada
  n27 --> n28
  n29[("LEE diagnostics.diagnostic_report_results")]:::efecto
  n28 --> n29
  n30(("200 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /diagnostics/accessions

Acesionar especímenes recibidos en laboratorio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen está rechazado y no puede acesionarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsSpecimensService.accession"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticsSpecimensService.tenantOfSpecimen"]:::llamada
  n4 --> n5
  n6["Llama a SpecimensRepository.findSpecimen"]:::llamada
  n5 --> n6
  n7[("LEE diagnostics.specimens")]:::efecto
  n6 --> n7
  n8{"!specimen"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Espécimen no encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Repite: por cada const specimenId de dto.specimenIds"]:::bucle
  n8 -->|"no"| n10
  n11["Llama a SpecimensRepository.findSpecimen"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE diagnostics.specimens")]:::efecto
  n11 --> n12
  n13{"!specimen"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Espécimen no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"specimen.statusConceptId === DIAG.SPECIMEN_REJECTED"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El espécimen está rechazado y no puede acesionarse"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SpecimensRepository.createAccession"]:::llamada
  n15 -->|"no"| n17
  n10 -->|"al terminar"| n17
  n18[("CREA diagnostics.laboratory_accessions")]:::efecto
  n17 --> n18
  n19["Repite: por cada const specimen de specimens"]:::bucle
  n18 --> n19
  n20["Llama a SpecimensRepository.addAccessionSpecimen"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("CREA diagnostics.accession_specimens")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA diagnostics.specimens · ACTUALIZA diagnostics.specimens")]:::efecto
  n21 --> n22
  n23["Llama a SpecimensRepository.recordCustodyEvent"]:::llamada
  n22 --> n23
  n24[("CREA diagnostics.specimen_chain_of_custody_events")]:::efecto
  n23 --> n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  n19 -->|"al terminar"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /diagnostics/analyzer-runs

Abrir una corrida de analizador (soporte para ingesta)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsLabService.createAnalyzerRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio de la corrida"]):::error
  n5 -->|"sí"| n6
  n7["Llama a LabWorkRepository.createAnalyzerRun"]:::llamada
  n5 -->|"no"| n7
  n8[("CREA diagnostics.analyzer_runs")]:::efecto
  n7 --> n8
  n9(("201 Responde con éxito")):::ok
  n8 --> n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /diagnostics/analyzer-runs/{id}/messages

Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Corrida de analizador no encontrada |
| 409 | `CONFLICT` | ConflictException: El mensaje ya fue ingerido para esta corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsLabService.ingestMessage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LabWorkRepository.findAnalyzerRun"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.analyzer_runs")]:::efecto
  n5 --> n6
  n7{"!run"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Corrida de analizador no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"dto.messageControlId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a LabWorkRepository.findMessageByControlId"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE diagnostics.analyzer_result_messages")]:::efecto
  n10 --> n11
  n12{"dup"}:::decision
  n11 --> n12
  n13(["409 CONFLICT El mensaje ya fue ingerido para esta corrida"]):::error
  n12 -->|"sí"| n13
  n14["Llama a LabWorkRepository.recordMessage"]:::llamada
  n12 -->|"no"| n14
  n9 -->|"no"| n14
  n15[("CREA diagnostics.analyzer_result_messages")]:::efecto
  n14 --> n15
  n16{"dto.laboratoryWorkOrderTestId"}:::decision
  n15 --> n16
  n17["Llama a LabWorkRepository.findWorkOrderTest"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE diagnostics.laboratory_work_order_tests")]:::efecto
  n17 --> n18
  n19{"test"}:::decision
  n18 --> n19
  n20[("ACTUALIZA diagnostics.laboratory_work_order_tests · ACTUALIZA diagnostics.laboratory_work_order_tests · ACTUA…")]:::efecto
  n19 -->|"sí"| n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"no"| n21
  n16 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /diagnostics/clinical-media

Adjuntar media clínica / imagen al chart

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El archivo ya está adjunto como media clínica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la media |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsMediaQualityService.attachMedia"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio de la media"]):::error
  n5 -->|"sí"| n6
  n7["Llama a MediaQualityRepository.findMediaByFile"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE diagnostics.clinical_media")]:::efecto
  n7 --> n8
  n9{"dup"}:::decision
  n8 --> n9
  n10(["409 CONFLICT El archivo ya está adjunto como media clínica"]):::error
  n9 -->|"sí"| n10
  n11["Llama a MediaQualityRepository.createMedia"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA diagnostics.clinical_media")]:::efecto
  n11 --> n12
  n13["Repite: por cada const a de dto.annotations ?? []"]:::bucle
  n12 --> n13
  n14["Llama a MediaQualityRepository.addAnnotation"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA diagnostics.media_annotations")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  n13 -->|"al terminar"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /diagnostics/containers/{id}/custody-events

Registrar cadena de custodia / traslado de contenedor

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contenedor no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsSpecimensService.recordCustodyEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SpecimensRepository.findContainer"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.specimen_containers")]:::efecto
  n5 --> n6
  n7{"!container"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Contenedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SpecimensRepository.recordContainerEvent"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA diagnostics.specimen_container_events")]:::efecto
  n9 --> n10
  n11["Llama a SpecimensRepository.recordCustodyEvent"]:::llamada
  n10 --> n11
  n12[("CREA diagnostics.specimen_chain_of_custody_events")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA diagnostics.specimen_containers")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /diagnostics/critical-results

Detectar y notificar un resultado crítico

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una notificación crítica para la observación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la notificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsReportsService.detectCritical"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio de la notificación"]):::error
  n5 -->|"sí"| n6
  n7["Llama a ReportsRepository.criticalExistsForObservation"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE diagnostics.critical_result_notifications")]:::efecto
  n7 --> n8
  n9{"await this.repo.criticalExistsForObservation(tx, dto.observationId)"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe una notificación crítica para la observación"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ReportsRepository.createCriticalNotification"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA diagnostics.critical_result_notifications")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /diagnostics/critical-results/{id}/acknowledge

Acusar recibo / escalar notificación crítica

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Notificación crítica no encontrada |
| 409 | `CONFLICT` | ConflictException: La notificación ya fue reconocida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsReportsService.acknowledgeCritical"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportsRepository.findCriticalNotification"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.critical_result_notifications")]:::efecto
  n5 --> n6
  n7{"!notification"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Notificación crítica no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"notification.notificationStatusConceptId === DIAG.CRITICAL_ACKNOWLEDGED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La notificación ya fue reconocida"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA diagnostics.critical_result_notifications · ACTUALIZA diagnostics.critical_result_notifications · A…")]:::efecto
  n9 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /diagnostics/data-quality-events

Registrar evento de calidad de datos + enlazar provenance

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio del evento de calidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsMediaQualityService.recordDataQualityEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio del evento de calidad"]):::error
  n5 -->|"sí"| n6
  n7["Llama a MediaQualityRepository.createDataQualityEvent"]:::llamada
  n5 -->|"no"| n7
  n8[("CREA diagnostics.diagnostic_data_quality_events")]:::efecto
  n7 --> n8
  n9{"dto.provenanceSourceId"}:::decision
  n8 --> n9
  n10["Llama a MediaQualityRepository.addProvenanceLink"]:::llamada
  n9 -->|"sí"| n10
  n11[("CREA diagnostics.diagnostic_provenance_links")]:::efecto
  n10 --> n11
  n12(("201 Responde con éxito")):::ok
  n11 --> n12
  n9 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /diagnostics/imaging-endpoints

Registrar un endpoint DICOM (soporte para STOW-RS)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Falta el tenant del endpoint de imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsImagingService.createEndpoint"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!dto.tenantId"}:::decision
  n4 --> n5
  n6(["409 CONFLICT Falta el tenant del endpoint de imagen"]):::error
  n5 -->|"sí"| n6
  n7["Llama a ImagingRepository.createEndpoint"]:::llamada
  n5 -->|"no"| n7
  n8[("CREA diagnostics.imaging_endpoints")]:::efecto
  n7 --> n8
  n9(("201 Responde con éxito")):::ok
  n8 --> n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /diagnostics/imaging-studies/{id}/dose-events

Registrar evento de dosis de radiación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Estudio de imagen no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsImagingService.recordDoseEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ImagingRepository.findStudy"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.imaging_studies")]:::efecto
  n5 --> n6
  n7{"!study"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Estudio de imagen no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ImagingRepository.recordDoseEvent"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA diagnostics.radiation_dose_events")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /diagnostics/reports/{reportId}/versions

Crear/enmendar versión de informe diagnóstico

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La versión que se enmienda no existe en este informe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio del informe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsReportsService.createReportVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio del informe"]):::error
  n5 -->|"sí"| n6
  n7{"dto.supersedesVersionId"}:::decision
  n5 -->|"no"| n7
  n8["Llama a ReportsRepository.findVersionInReport"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n8 --> n9
  n10{"!prev"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND La versión que se enmienda no existe en este informe"]):::error
  n10 -->|"sí"| n11
  n12["Llama a ReportsRepository.maxVersionNumber"]:::llamada
  n10 -->|"no"| n12
  n7 -->|"no"| n12
  n13[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n12 --> n13
  n14["Llama a ReportsRepository.createVersion"]:::llamada
  n13 --> n14
  n15[("CREA diagnostics.diagnostic_report_versions")]:::efecto
  n14 --> n15
  n16["Repite: por cada const r de dto.results ?? []"]:::bucle
  n15 --> n16
  n17["Llama a ReportsRepository.addResult"]:::llamada
  n16 -->|"cada elemento"| n17
  n18[("CREA diagnostics.diagnostic_report_results")]:::efecto
  n17 --> n18
  n19["Repite: por cada const f de dto.files ?? []"]:::bucle
  n18 --> n19
  n16 -->|"al terminar"| n19
  n20["Llama a ReportsRepository.addFile"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("CREA diagnostics.diagnostic_report_files")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  n19 -->|"al terminar"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

Validar y liberar una versión del informe

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de informe no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya fue liberada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no es elegible para liberación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsReportsService.releaseVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportsRepository.findVersionInReport"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.diagnostic_report_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de informe no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"version.releaseEligibilityConceptId !== DIAG.RELEASE_ELIGIBLE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La versión no es elegible para liberación"]):::error
  n9 -->|"sí"| n10
  n11{"version.clinicalStatusConceptId === DIAG.REPORT_FINAL"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La versión ya fue liberada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ReportsRepository.recordReleaseEvent"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA diagnostics.diagnostic_release_events")]:::efecto
  n13 --> n14
  n15[("ACTUALIZA diagnostics.diagnostic_report_versions · ACTUALIZA diagnostics.diagnostic_report_versions")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticOrdersRepository.findReportById"]:::llamada
  n15 --> n16
  n17[("LEE clinical.diagnostic_reports")]:::efecto
  n16 --> n17
  n18{"report"}:::decision
  n17 --> n18
  n19["Llama a DiagnosticOrdersRepository.markReportReleased"]:::llamada
  n18 -->|"sí"| n19
  n20[("ACTUALIZA clinical.diagnostic_reports · ACTUALIZA clinical.diagnostic_reports · ACTUALIZA clinical.diagnostic…")]:::efecto
  n19 --> n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /diagnostics/results/{observationId}/verifications

Verificar (técnica/facultativa) un resultado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsLabService.verifyResult"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!tenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Falta el tenant custodio de la verificación"]):::error
  n5 -->|"sí"| n6
  n7["Llama a LabWorkRepository.recordVerification"]:::llamada
  n5 -->|"no"| n7
  n8[("CREA diagnostics.result_verifications")]:::efecto
  n7 --> n8
  n9["Llama a LabWorkRepository.markTestsVerifiedForObservation"]:::llamada
  n8 --> n9
  n10[("ACTUALIZA diagnostics.laboratory_work_order_tests")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /diagnostics/specimens/{id}/containers

Registrar un contenedor de espécimen (soporte para custodia)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsSpecimensService.createContainer"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SpecimensRepository.findSpecimen"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.specimens")]:::efecto
  n5 --> n6
  n7{"!specimen"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Espécimen no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SpecimensRepository.createContainer"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA diagnostics.specimen_containers")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /diagnostics/specimens/{id}/rejection

Rechazar espécimen y solicitar recolección

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen ya está rechazado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsSpecimensService.reject"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SpecimensRepository.findSpecimen"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.specimens")]:::efecto
  n5 --> n6
  n7{"!specimen"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Espécimen no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"specimen.statusConceptId === DIAG.SPECIMEN_REJECTED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El espécimen ya está rechazado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a SpecimensRepository.recordRejection"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA diagnostics.specimen_rejection_events")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA diagnostics.specimens")]:::efecto
  n12 --> n13
  n14["Llama a SpecimensRepository.cancelTestsForSpecimen"]:::llamada
  n13 --> n14
  n15[("ACTUALIZA diagnostics.laboratory_work_order_tests")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. POST /diagnostics/work-orders

Abrir orden de trabajo y desglosar pruebas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsLabService.createWorkOrder"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SpecimensRepository.findAccession"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.laboratory_accessions")]:::efecto
  n5 --> n6
  n7{"!accession"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Acesión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a LabWorkRepository.createWorkOrder"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA diagnostics.laboratory_work_orders")]:::efecto
  n9 --> n10
  n11["Repite: por cada const t de dto.tests"]:::bucle
  n10 --> n11
  n12["Llama a LabWorkRepository.createWorkOrderTest"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA diagnostics.laboratory_work_order_tests")]:::efecto
  n12 --> n13
  n14[("ACTUALIZA diagnostics.laboratory_accessions")]:::efecto
  n13 --> n14
  n11 -->|"al terminar"| n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. POST /dicomweb/studies

Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Endpoint de imagen no encontrado |
| 409 | `CONFLICT` | ConflictException: El estudio DICOM ya fue almacenado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticsImagingService.storeStudy"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ImagingRepository.findEndpoint"]:::llamada
  n4 --> n5
  n6[("LEE diagnostics.imaging_endpoints")]:::efecto
  n5 --> n6
  n7{"!endpoint"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Endpoint de imagen no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ImagingRepository.findStudyByUid"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE diagnostics.imaging_studies")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El estudio DICOM ya fue almacenado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ImagingRepository.createStudy"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA diagnostics.imaging_studies")]:::efecto
  n13 --> n14
  n15["Repite: por cada const s de dto.series"]:::bucle
  n14 --> n15
  n16["Llama a ImagingRepository.createSeries"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("CREA diagnostics.imaging_series")]:::efecto
  n16 --> n17
  n18["Repite: por cada const inst de s.instances ?? []"]:::bucle
  n17 --> n18
  n19["Llama a ImagingRepository.createInstance"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("CREA diagnostics.imaging_instances")]:::efecto
  n19 --> n20
  n21{"inst.storageBackendId && inst.objectKey"}:::decision
  n20 --> n21
  n22["Llama a ImagingRepository.createObjectLocation"]:::llamada
  n21 -->|"sí"| n22
  n23[("CREA diagnostics.dicom_object_locations")]:::efecto
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  n21 -->|"no"| n24
  n18 -->|"al terminar"| n24
  n15 -->|"al terminar"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /diagnostics/patients/{patientProfileId}/imaging-studies | 200, 400, 401, 403, 429 | 1 |
| GET /diagnostics/patients/{patientProfileId}/orders | 200, 400, 401, 403, 429 | 2 |
| POST /diagnostics/specimens | 201, 400, 401, 403, 429 | 1 |
| GET /diagnostics/work-orders | 200, 401, 403, 429 | 1 |
