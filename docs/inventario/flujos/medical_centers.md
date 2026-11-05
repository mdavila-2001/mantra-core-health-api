<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `medical_centers`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 2 (1 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [medical_centers](../endpoints/medical_centers.md)

## Proceso: Centros médicos — búsqueda por procedimientos

- **Código:** `medical_centers` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 2
- **Actores:** Cualquier sesión válida · PATIENT
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/medical_centers/README.md`

### Para qué sirve

Busca centros médicos (sedes de una práctica) por los procedimientos del nomenclador boliviano (`VS_BO_MEDICAL_PROCEDURE`) que ofrecen con precio publicado. Es la mitad de lectura del flujo «centros médicos»: el catálogo de la sede, las afiliaciones y el modo de ejecutor de la orden viven en `practice` y `clinical`.

_Fuente: `src/modules/medical_centers/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:MedicalCentersController` | Operaciones de MedicalCentersController que el README no asigna a un caso de uso | GET /medical-centers/search | Cualquier sesión válida | BAJO | 7 |
|  |  | GET /medical-centers/search/for-my-orders | PATIENT | BAJO | 11 |

### Diagrama — etapas `ctrl:MedicalCentersController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a11(["PATIENT"]):::actor
  t3[("billing.service_catalog")]:::tabla
  t4[("common.addresses")]:::tabla
  t5[("practice.healthcare_services")]:::tabla
  t6[("practice.practice_sites")]:::tabla
  t7[("practice.practices")]:::tabla
  t8[("terminology.catalog_concepts")]:::tabla
  t12[("clinical.service_requests")]:::tabla
  t9[("+1 tablas más")]
  t13[("+5 tablas más")]
  subgraph s0["ctrl:MedicalCentersController · Operaciones de MedicalCentersController que el…"]
    o1["GET /medical-centers/search"]:::op
    o10["GET /medical-centers/search/for-my-orders"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  o1 -.-> t9
  a11 --> o10
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t6
  o10 -->|"LEE"| t7
  o10 -.-> t13
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /medical-centers/search/for-my-orders

Buscar centros médicos para mis órdenes

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalCentersForMyOrdersService.searchForOrders"]:::llamada
  n2 --> n3
  n4["Llama a OwnServiceRequestsRepository.resolveOwnPatientProfileId"]:::llamada
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
  n13["Llama a OwnServiceRequestsRepository.findOwned"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE clinical.service_requests")]:::efecto
  n13 --> n14
  n15{"owned.length !== wanted.length"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Orden no encontrada"]):::error
  n15 -->|"sí"| n16
  n17["Llama a MedicalCentersSearchService.searchAll"]:::llamada
  n15 -->|"no"| n17
  n18["Llama a MedicalCenterOffersRepository.findSiteOffers"]:::llamada
  n17 --> n18
  n19[("LEE practice.healthcare_services · LEE billing.service_catalog · LEE practice.practice_sites · LEE practice.p…")]:::efecto
  n18 --> n19
  n20["Llama a MedicalCenterOffersRepository.specialtiesOf"]:::llamada
  n19 --> n20
  n21[("LEE terminology.concept_properties")]:::efecto
  n20 --> n21
  n22["Llama a ProcedureReferenceReader.referencesFor"]:::llamada
  n21 --> n22
  n23[("LEE terminology.concept_properties")]:::efecto
  n22 --> n23
  n24["Llama a PractitionerAffiliationsRepository.findActiveSites"]:::llamada
  n23 --> n24
  n25[("LEE practice.practitioner_role_assignments · LEE practice.healthcare_services")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
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
| GET /medical-centers/search | 200, 400, 401, 403, 429 | 7 |
