<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `terminology`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 31 (26 con decisiones propias, 5 sin ellas)
- Inventario de endpoints del módulo: [terminology](../endpoints/terminology.md)

## Proceso: Terminology module

- **Código:** `terminology` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 31
- **Actores:** Cualquier sesión válida · Público (sin sesión) · SECURITY_ADMIN · SUPERADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/terminology/README.md`

### Para qué sirve

Administración de los catálogos de terminología de la plataforma: fuentes, sistemas de códigos y sus versiones, conceptos (con designaciones, propiedades y relaciones), conjuntos de valores con su expansión, mapeos entre sistemas y la política de catálogo de cada tenant. El esquema es *concept-driven*: estados y tipos no son enums de columna sino filas de `terminology.catalog_concepts` referenciadas por FK (`*_concept_id`), resueltas desde `CONCEPTS` (`src/common`).

_Fuente: `src/modules/terminology/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AdminGlossaryController` | Operaciones de AdminGlossaryController que el README no asigna a un caso de uso | GET /admin/catalogs/glossary | SECURITY_ADMIN · SUPERADMIN | BAJO | 3 |
|  |  | POST /admin/catalogs/glossary | SUPERADMIN | MEDIO | 10 |
|  |  | GET /admin/catalogs/glossary/{conceptId} | SECURITY_ADMIN · SUPERADMIN | BAJO | 3 |
|  |  | PATCH /admin/catalogs/glossary/{conceptId} | SUPERADMIN | MEDIO | 6 |
|  |  | POST /admin/catalogs/glossary/{conceptId}/deactivate | SUPERADMIN | MEDIO | 6 |
|  |  | POST /admin/catalogs/glossary/{conceptId}/reactivate | SUPERADMIN | MEDIO | 6 |
| `ctrl:TerminologyCodeSystemsController` | Operaciones de TerminologyCodeSystemsController que el README no asigna a un caso de uso | GET /terminology/code-systems | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /terminology/code-systems | SECURITY_ADMIN | MEDIO | 4 |
|  |  | GET /terminology/code-systems/{id}/versions | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /terminology/code-systems/{id}/versions | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:TerminologyConceptsController` | Operaciones de TerminologyConceptsController que el README no asigna a un caso de uso | GET /terminology/concepts | Cualquier sesión válida | BAJO | 7 |
|  |  | GET /terminology/concepts/{conceptId} | Cualquier sesión válida | BAJO | 7 |
|  |  | POST /terminology/concepts/{conceptId}/$deprecate | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /terminology/concepts/{conceptId}/designations | SECURITY_ADMIN | MEDIO | 5 |
|  |  | GET /terminology/concepts/{conceptId}/glossary-article | Cualquier sesión válida | BAJO | 1 |
|  |  | GET /terminology/concepts/{conceptId}/glossary-neighborhood | Cualquier sesión válida | BAJO | 8 |
|  |  | POST /terminology/concepts/{conceptId}/properties | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /terminology/concepts/{conceptId}/relationships | SECURITY_ADMIN | MEDIO | 3 |
|  |  | GET /terminology/concepts/glossary-graph | Cualquier sesión válida | BAJO | 7 |
| `ctrl:TerminologyFhirController` | Operaciones de TerminologyFhirController que el README no asigna a un caso de uso | GET /terminology/CodeSystem/$lookup | Cualquier sesión válida | BAJO | 5 |
|  |  | POST /terminology/ConceptMap/$translate | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /terminology/ValueSet/{id}/$expand | SECURITY_ADMIN | ALTO | 10 |
| `ctrl:TerminologyImportTemplateController` | Operaciones de TerminologyImportTemplateController que el README no asigna a un caso de uso | GET /terminology/import-template | SECURITY_ADMIN | BAJO | 0 |
| `ctrl:TerminologyTenantCatalogController` | Operaciones de TerminologyTenantCatalogController que el README no asigna a un caso de uso | PUT /terminology/tenants/{tenantId}/catalog-policies | SECURITY_ADMIN | MEDIO | 8 |
| `ctrl:TerminologyValueSetsController` | Operaciones de TerminologyValueSetsController que el README no asigna a un caso de uso | GET /terminology/value-sets | Público (sin sesión) | BAJO | 3 |
|  |  | POST /terminology/value-sets | SECURITY_ADMIN | MEDIO | 4 |
|  |  | GET /terminology/value-sets/{id}/$expand | Público (sin sesión) | BAJO | 6 |
|  |  | GET /terminology/value-sets/$glossary-facets | Público (sin sesión) | BAJO | 5 |
| `ctrl:TerminologyVersionsController` | Operaciones de TerminologyVersionsController que el README no asigna a un caso de uso | POST /terminology/versions/{versionId}/import | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /terminology/versions/{versionId}/import-file | SECURITY_ADMIN | MEDIO | 7 |
|  |  | POST /terminology/versions/{versionId}/publish | SECURITY_ADMIN | MEDIO | 4 |

### Diagrama 1 de 2 — etapas `ctrl:AdminGlossaryController`, `ctrl:TerminologyCodeSystemsController`, `ctrl:TerminologyConceptsController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN · SUPERADMIN"]):::actor
  a7(["SUPERADMIN"]):::actor
  a15(["SECURITY_ADMIN"]):::actor
  a23(["Cualquier sesión válida"]):::actor
  t3[("terminology.catalog_concepts")]:::tabla
  t4[("terminology.concept_designations")]:::tabla
  t5[("terminology.concept_properties")]:::tabla
  t12[("terminology.value_set_members")]:::tabla
  t16[("terminology.code_systems")]:::tabla
  t18[("terminology.terminology_sources")]:::tabla
  t20[("terminology.code_system_versions")]:::tabla
  t24[("terminology.concept_relationships")]:::tabla
  t25[("terminology.value_set_versions")]:::tabla
  t33[("terminology.concept_relationship_evidence")]:::tabla
  t41[("terminology.concept_maps")]:::tabla
  t46[("terminology.tenant_catalog_policies")]:::tabla
  t47[("terminology.tenant_concept_config")]:::tabla
  t8[("+4 tablas más")]
  subgraph s0["ctrl:AdminGlossaryController · Operaciones de AdminGlossaryController que el RE…"]
    o1["GET /admin/catalogs/glossary"]:::op
    o6["POST /admin/catalogs/glossary"]:::op
    o9["GET /admin/catalogs/glossary/{conceptId}"]:::op
    o10["PATCH /admin/catalogs/glossary/{conceptId}"]:::op
    o11["POST /admin/catalogs/glossary/{conceptId}/deactivate"]:::op
    o13["POST /admin/catalogs/glossary/{conceptId}/reactivate"]:::op
  end
  subgraph s1["ctrl:TerminologyCodeSystemsController · Operaciones de TerminologyCodeSystemsCo…"]
    o14["GET /terminology/code-systems"]:::op
    o17["POST /terminology/code-systems"]:::op
    o19["GET /terminology/code-systems/{id}/versions"]:::op
    o21["POST /terminology/code-systems/{id}/versions"]:::op
  end
  t26[("+1 tablas más")]
  t28[("+1 tablas más")]
  t34[("+2 tablas más")]
  t38[("+1 tablas más")]
  subgraph s2["ctrl:TerminologyConceptsController · Operaciones de TerminologyConceptsControll…"]
    o22["GET /terminology/concepts"]:::op
    o27["GET /terminology/concepts/{conceptId}"]:::op
    o29["POST /terminology/concepts/{conceptId}/$deprecate"]:::op
    o30["POST /terminology/concepts/{conceptId}/designations"]:::op
    o31["GET /terminology/concepts/{conceptId}/glossary-article"]:::op
    o32["GET /terminology/concepts/{conceptId}/glossary-neighborhood"]:::op
    o35["POST /terminology/concepts/{conceptId}/properties"]:::op
    o36["POST /terminology/concepts/{conceptId}/relationships"]:::op
    o37["GET /terminology/concepts/glossary-graph"]:::op
  end
  t43[("+4 tablas más")]
  subgraph s3["ctrl:TerminologyFhirController · Operaciones de TerminologyFhirController que e…"]
    o39["GET /terminology/CodeSystem/$lookup"]:::op
    o40["POST /terminology/ConceptMap/$translate"]:::op
    o42["POST /terminology/ValueSet/{id}/$expand"]:::op
  end
  subgraph s4["ctrl:TerminologyImportTemplateController · Operaciones de TerminologyImportTemp…"]
    o44["GET /terminology/import-template"]:::op
  end
  t48[("+2 tablas más")]
  subgraph s5["ctrl:TerminologyTenantCatalogController · Operaciones de TerminologyTenantCatal…"]
    o45["PUT /terminology/tenants/{tenantId}/catalog-policies"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a7 --> o6
  o6 -->|"CREA"| t3
  o6 -->|"LEE"| t3
  o6 -->|"CREA"| t4
  o6 -->|"LEE"| t4
  o6 -->|"CREA"| t5
  o6 -->|"LEE"| t5
  o6 -.-> t8
  a2 --> o9
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  o9 -->|"LEE"| t5
  a7 --> o10
  o10 -->|"LEE"| t3
  o10 -->|"CREA"| t4
  o10 -->|"LEE"| t4
  o10 -->|"ACTUALIZA"| t5
  o10 -->|"CREA"| t5
  o10 -->|"LEE"| t5
  a7 --> o11
  o11 -->|"ACTUALIZA"| t3
  o11 -->|"LEE"| t3
  o11 -->|"LEE"| t4
  o11 -->|"LEE"| t5
  o11 -->|"ACTUALIZA"| t12
  o11 -->|"LEE"| t12
  a7 --> o13
  o13 -->|"ACTUALIZA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t4
  o13 -->|"LEE"| t5
  o13 -->|"ACTUALIZA"| t12
  o13 -->|"LEE"| t12
  a15 --> o14
  o14 -->|"LEE"| t16
  a15 --> o17
  o17 -->|"CREA"| t16
  o17 -->|"LEE"| t16
  o17 -->|"CREA"| t18
  o17 -->|"LEE"| t18
  a15 --> o19
  o19 -->|"LEE"| t20
  a15 --> o21
  o21 -->|"CREA"| t20
  o21 -->|"LEE"| t20
  o21 -->|"LEE"| t16
  a23 --> o22
  o22 -->|"LEE"| t3
  o22 -->|"LEE"| t4
  o22 -->|"LEE"| t5
  o22 -->|"LEE"| t24
  o22 -->|"LEE"| t12
  o22 -->|"LEE"| t25
  o22 -.-> t26
  a23 --> o27
  o27 -->|"LEE"| t3
  o27 -->|"LEE"| t4
  o27 -->|"LEE"| t5
  o27 -->|"LEE"| t24
  o27 -->|"LEE"| t12
  o27 -->|"LEE"| t25
  o27 -.-> t28
  a15 --> o29
  o29 -->|"ACTUALIZA"| t3
  o29 -->|"LEE"| t3
  o29 -->|"ACTUALIZA"| t12
  o29 -->|"LEE"| t12
  a15 --> o30
  o30 -->|"LEE"| t3
  o30 -->|"ACTUALIZA"| t4
  o30 -->|"CREA"| t4
  o30 -->|"LEE"| t4
  o30 -->|"CREA"| t5
  a23 --> o31
  o31 -->|"LEE"| t5
  a23 --> o32
  o32 -->|"LEE"| t3
  o32 -->|"LEE"| t4
  o32 -->|"LEE"| t5
  o32 -->|"LEE"| t33
  o32 -->|"LEE"| t24
  o32 -->|"LEE"| t12
  o32 -.-> t34
  a15 --> o35
  o35 -->|"LEE"| t3
  o35 -->|"ACTUALIZA"| t5
  o35 -->|"CREA"| t5
  o35 -->|"LEE"| t5
  a15 --> o36
  o36 -->|"LEE"| t3
  o36 -->|"CREA"| t24
  o36 -->|"LEE"| t24
  a23 --> o37
  o37 -->|"LEE"| t3
  o37 -->|"LEE"| t4
  o37 -->|"LEE"| t5
  o37 -->|"LEE"| t24
  o37 -->|"LEE"| t12
  o37 -->|"LEE"| t25
  o37 -.-> t38
  a23 --> o39
  o39 -->|"LEE"| t3
  o39 -->|"LEE"| t20
  o39 -->|"LEE"| t16
  o39 -->|"LEE"| t4
  o39 -->|"LEE"| t5
  a23 --> o40
  o40 -->|"LEE"| t3
  o40 -->|"ACTUALIZA"| t41
  o40 -->|"CREA"| t41
  o40 -->|"LEE"| t41
  a15 --> o42
  o42 -->|"LEE"| t3
  o42 -->|"LEE"| t20
  o42 -->|"LEE"| t5
  o42 -->|"LEE"| t24
  o42 -->|"BORRA"| t12
  o42 -->|"CREA"| t12
  o42 -.-> t43
  a15 --> o44
  a15 --> o45
  o45 -->|"LEE"| t3
  o45 -->|"ACTUALIZA"| t46
  o45 -->|"CREA"| t46
  o45 -->|"LEE"| t46
  o45 -->|"ACTUALIZA"| t47
  o45 -->|"CREA"| t47
  o45 -.-> t48
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:TerminologyValueSetsController`, `ctrl:TerminologyVersionsController`

```mermaid
flowchart LR
  a2(["Público (sin sesión)"]):::actor
  a7(["SECURITY_ADMIN"]):::actor
  t3[("terminology.value_set_members")]:::tabla
  t4[("terminology.value_set_versions")]:::tabla
  t5[("terminology.value_sets")]:::tabla
  t8[("terminology.value_set_rules")]:::tabla
  t10[("terminology.catalog_concepts")]:::tabla
  t11[("terminology.concept_designations")]:::tabla
  t12[("terminology.concept_properties")]:::tabla
  t15[("terminology.code_system_versions")]:::tabla
  t17[("terminology.catalog_import_batches")]:::tabla
  subgraph s0["ctrl:TerminologyValueSetsController · Operaciones de TerminologyValueSetsContro…"]
    o1["GET /terminology/value-sets"]:::op
    o6["POST /terminology/value-sets"]:::op
    o9["GET /terminology/value-sets/{id}/$expand"]:::op
    o13["GET /terminology/value-sets/$glossary-facets"]:::op
  end
  t18[("+1 tablas más")]
  subgraph s1["ctrl:TerminologyVersionsController · Operaciones de TerminologyVersionsControll…"]
    o14["POST /terminology/versions/{versionId}/import"]:::op
    o16["POST /terminology/versions/{versionId}/import-file"]:::op
    o19["POST /terminology/versions/{versionId}/publish"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a7 --> o6
  o6 -->|"CREA"| t8
  o6 -->|"CREA"| t4
  o6 -->|"CREA"| t5
  o6 -->|"LEE"| t5
  a2 --> o9
  o9 -->|"LEE"| t10
  o9 -->|"LEE"| t11
  o9 -->|"LEE"| t12
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  o9 -->|"LEE"| t5
  a2 --> o13
  o13 -->|"LEE"| t10
  o13 -->|"LEE"| t11
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t4
  o13 -->|"LEE"| t5
  a7 --> o14
  o14 -->|"CREA"| t10
  o14 -->|"LEE"| t10
  o14 -->|"LEE"| t15
  a7 --> o16
  o16 -->|"CREA"| t10
  o16 -->|"LEE"| t10
  o16 -->|"CREA"| t17
  o16 -->|"ACTUALIZA"| t17
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t15
  o16 -.-> t18
  a7 --> o19
  o19 -->|"ACTUALIZA"| t10
  o19 -->|"LEE"| t10
  o19 -->|"ACTUALIZA"| t15
  o19 -->|"LEE"| t15
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /admin/catalogs/glossary

Crear un término (idempotente por slug)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un término del glosario con ese slug |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El glosario no está inicializado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminGlossaryService.create"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogConceptsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.catalog_concepts")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8["Llama a AdminGlossaryService.toTerms"]:::llamada
  n7 -->|"sí"| n8
  n9["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n8 --> n9
  n10[("LEE terminology.concept_properties")]:::efecto
  n9 --> n10
  n11["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n10 --> n11
  n12[("LEE terminology.concept_designations")]:::efecto
  n11 --> n12
  n13(["409 CONFLICT Ya existe un término del glosario con ese slug"]):::error
  n12 --> n13
  n14["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n7 -->|"no"| n14
  n15[("LEE terminology.value_sets")]:::efecto
  n14 --> n15
  n16["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_set_versions")]:::efecto
  n16 --> n17
  n18{"!version"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED El glosario no está inicializado"]):::error
  n18 -->|"sí"| n19
  n20[("CREA terminology.catalog_concepts")]:::efecto
  n18 -->|"no"| n20
  n21["Llama a ConceptDesignationsRepository.createDesignation"]:::llamada
  n20 --> n21
  n22[("CREA terminology.concept_designations")]:::efecto
  n21 --> n22
  n23["Llama a ConceptDesignationsRepository.createProperty"]:::llamada
  n22 --> n23
  n24[("CREA terminology.concept_properties")]:::efecto
  n23 --> n24
  n25["Llama a ConceptDesignationsRepository.createProperty"]:::llamada
  n24 --> n25
  n26[("CREA terminology.concept_properties")]:::efecto
  n25 --> n26
  n27["Llama a ValueSetsRepository.countMembersByVersionIds"]:::llamada
  n26 --> n27
  n28[("LEE terminology.value_set_members")]:::efecto
  n27 --> n28
  n29["Llama a ValueSetsRepository.createMember"]:::llamada
  n28 --> n29
  n30[("CREA terminology.value_set_members")]:::efecto
  n29 --> n30
  n31["Llama a AdminGlossaryService.toTerms"]:::llamada
  n30 --> n31
  n32["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n31 --> n32
  n33[("LEE terminology.concept_properties")]:::efecto
  n32 --> n33
  n34["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n33 --> n34
  n35[("LEE terminology.concept_designations")]:::efecto
  n34 --> n35
  n36(("201 Responde con éxito")):::ok
  n35 --> n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /admin/catalogs/glossary/{conceptId}

Ver un término con su versión

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Término no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a AdminGlossaryService.get"]:::llamada
  n2 --> n3
  n4["Llama a AdminGlossaryService.loadTerm"]:::llamada
  n3 --> n4
  n5["Llama a CatalogConceptsRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE terminology.catalog_concepts")]:::efecto
  n5 --> n6
  n7["Llama a CatalogConceptsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE terminology.catalog_concepts")]:::efecto
  n7 --> n8
  n9{"!concept || concept.codeSystemVersionId !== glossaryCodeSystemVersionId"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Término no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a AdminGlossaryService.toTerms"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n11 --> n12
  n13[("LEE terminology.concept_properties")]:::efecto
  n12 --> n13
  n14["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n13 --> n14
  n15[("LEE terminology.concept_designations")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. PATCH /admin/catalogs/glossary/{conceptId}

Editar un término con precondición de versión

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: No hay nada que cambiar: envíe text o nameEs |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Término no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AdminGlossaryService.update"]:::llamada
  n2 --> n3
  n4{"dto.text === undefined && dto.nameEs === undefined"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED No hay nada que cambiar: envíe text o nameEs"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a AdminGlossaryService.loadTerm"]:::llamada
  n6 --> n7
  n8["Llama a CatalogConceptsRepository.findByIdForUpdate"]:::llamada
  n7 --> n8
  n9[("LEE terminology.catalog_concepts")]:::efecto
  n8 --> n9
  n10["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE terminology.catalog_concepts")]:::efecto
  n10 --> n11
  n12{"!concept || concept.codeSystemVersionId !== glossaryCodeSystemVersionId"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Término no encontrado"]):::error
  n12 -->|"sí"| n13
  n14{"dto.text !== undefined"}:::decision
  n12 -->|"no"| n14
  n15["Llama a ConceptDesignationsRepository.findProperty"]:::llamada
  n14 -->|"sí"| n15
  n16[("LEE terminology.concept_properties")]:::efecto
  n15 --> n16
  n17{"existing"}:::decision
  n16 --> n17
  n18[("ACTUALIZA terminology.concept_properties")]:::efecto
  n17 -->|"sí"| n18
  n19["Llama a ConceptDesignationsRepository.createProperty"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA terminology.concept_properties")]:::efecto
  n19 --> n20
  n21{"dto.nameEs !== undefined"}:::decision
  n18 --> n21
  n20 --> n21
  n14 -->|"no"| n21
  n22["Llama a ConceptDesignationsRepository.findByLanguageForUpdate"]:::llamada
  n21 -->|"sí"| n22
  n23[("LEE terminology.concept_designations")]:::efecto
  n22 --> n23
  n24{"preferred"}:::decision
  n23 --> n24
  n25["Llama a ConceptDesignationsRepository.createDesignation"]:::llamada
  n24 -->|"no"| n25
  n26[("CREA terminology.concept_designations")]:::efecto
  n25 --> n26
  n27["Llama a AdminGlossaryService.toTerms"]:::llamada
  n24 -->|"sí"| n27
  n26 --> n27
  n21 -->|"no"| n27
  n28["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n27 --> n28
  n29[("LEE terminology.concept_properties")]:::efecto
  n28 --> n29
  n30["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n29 --> n30
  n31[("LEE terminology.concept_designations")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /admin/catalogs/glossary/{conceptId}/deactivate

Retirar un término (no se borra)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Término no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AdminGlossaryService.setActive"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AdminGlossaryService.loadTerm"]:::llamada
  n4 --> n5
  n6["Llama a CatalogConceptsRepository.findByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE terminology.catalog_concepts")]:::efecto
  n6 --> n7
  n8["Llama a CatalogConceptsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE terminology.catalog_concepts")]:::efecto
  n8 --> n9
  n10{"!concept || concept.codeSystemVersionId !== glossaryCodeSystemVersionId"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Término no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"concept.stateConceptId === target"}:::decision
  n10 -->|"no"| n12
  n13["Llama a AdminGlossaryService.toTerms"]:::llamada
  n12 -->|"sí"| n13
  n14["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n13 --> n14
  n15[("LEE terminology.concept_properties")]:::efecto
  n14 --> n15
  n16["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n15 --> n16
  n17[("LEE terminology.concept_designations")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA terminology.catalog_concepts · ACTUALIZA terminology.catalog_concepts")]:::efecto
  n17 --> n18
  n12 -->|"no"| n18
  n19["Llama a ValueSetsRepository.findMembersByConceptForUpdate"]:::llamada
  n18 --> n19
  n20[("LEE terminology.value_set_members")]:::efecto
  n19 --> n20
  n21["Repite: por cada const member de members"]:::bucle
  n20 --> n21
  n22[("ACTUALIZA terminology.value_set_members")]:::efecto
  n21 -->|"cada elemento"| n22
  n23["Llama a AdminGlossaryService.toTerms"]:::llamada
  n22 --> n23
  n21 -->|"al terminar"| n23
  n24["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n23 --> n24
  n25[("LEE terminology.concept_properties")]:::efecto
  n24 --> n25
  n26["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n25 --> n26
  n27[("LEE terminology.concept_designations")]:::efecto
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /admin/catalogs/glossary/{conceptId}/reactivate

Reactivar un término retirado

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Término no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AdminGlossaryService.setActive"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AdminGlossaryService.loadTerm"]:::llamada
  n4 --> n5
  n6["Llama a CatalogConceptsRepository.findByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE terminology.catalog_concepts")]:::efecto
  n6 --> n7
  n8["Llama a CatalogConceptsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE terminology.catalog_concepts")]:::efecto
  n8 --> n9
  n10{"!concept || concept.codeSystemVersionId !== glossaryCodeSystemVersionId"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Término no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"concept.stateConceptId === target"}:::decision
  n10 -->|"no"| n12
  n13["Llama a AdminGlossaryService.toTerms"]:::llamada
  n12 -->|"sí"| n13
  n14["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n13 --> n14
  n15[("LEE terminology.concept_properties")]:::efecto
  n14 --> n15
  n16["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n15 --> n16
  n17[("LEE terminology.concept_designations")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA terminology.catalog_concepts · ACTUALIZA terminology.catalog_concepts")]:::efecto
  n17 --> n18
  n12 -->|"no"| n18
  n19["Llama a ValueSetsRepository.findMembersByConceptForUpdate"]:::llamada
  n18 --> n19
  n20[("LEE terminology.value_set_members")]:::efecto
  n19 --> n20
  n21["Repite: por cada const member de members"]:::bucle
  n20 --> n21
  n22[("ACTUALIZA terminology.value_set_members")]:::efecto
  n21 -->|"cada elemento"| n22
  n23["Llama a AdminGlossaryService.toTerms"]:::llamada
  n22 --> n23
  n21 -->|"al terminar"| n23
  n24["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n23 --> n24
  n25[("LEE terminology.concept_properties")]:::efecto
  n24 --> n25
  n26["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n25 --> n26
  n27[("LEE terminology.concept_designations")]:::efecto
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /terminology/code-systems

UC-03-01: crea un sistema de códigos y su fuente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un sistema de códigos con ese código interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CodeSystemsService.createCodeSystem"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CodeSystemsRepository.findByInternalCode"]:::llamada
  n4 --> n5
  n6[("LEE terminology.code_systems")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un sistema de códigos con ese código interno"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TerminologySourcesRepository.findByCode"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE terminology.terminology_sources")]:::efecto
  n9 --> n10
  n11{"!source"}:::decision
  n10 --> n11
  n12["Llama a TerminologySourcesRepository.create"]:::llamada
  n11 -->|"sí"| n12
  n13[("CREA terminology.terminology_sources")]:::efecto
  n12 --> n13
  n14["Llama a CodeSystemsRepository.create"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("CREA terminology.code_systems")]:::efecto
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

#### 7. POST /terminology/code-systems/{id}/versions

UC-03-02: crea una versión (borrador) de un sistema de códigos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sistema de códigos no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión para el sistema de códigos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CodeSystemsService.createVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CodeSystemsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.code_systems")]:::efecto
  n5 --> n6
  n7{"!codeSystem"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Sistema de códigos no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CodeSystemVersionsRepository.findByCodeSystemAndVersion"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE terminology.code_system_versions")]:::efecto
  n9 --> n10
  n11{"duplicate"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya existe esa versión para el sistema de códigos"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CodeSystemVersionsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA terminology.code_system_versions")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. GET /terminology/CodeSystem/$lookup

UC-03-11: resuelve un concepto por sistema y código

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: $lookup exige los parámetros system y code |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sistema de códigos no encontrado; ResourceNotFoundException: El sistema de códigos no tiene versión vigente publicada; ResourceNotFoundException: Código no encontrado en la versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3{"!system || !code"}:::decision
  n2 --> n3
  n4(["400 VALIDATION_FAILED $lookup exige los parámetros system y code"]):::error
  n3 -->|"sí"| n4
  n5["Llama a ConceptsService.lookupConcept"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a CodeSystemsRepository.findByCanonicalUrl"]:::llamada
  n5 --> n6
  n7[("LEE terminology.code_systems")]:::efecto
  n6 --> n7
  n8{"!codeSystem"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Sistema de códigos no encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CodeSystemVersionsRepository.findDefaultActiveVersion"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE terminology.code_system_versions")]:::efecto
  n10 --> n11
  n12{"!version"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND El sistema de códigos no tiene versión vigente publicada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CatalogConceptsRepository.findByVersionAndCode"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE terminology.catalog_concepts")]:::efecto
  n14 --> n15
  n16{"!concept"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Código no encontrado en la versión vigente"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ConceptDesignationsRepository.findByConcept"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE terminology.concept_designations")]:::efecto
  n18 --> n19
  n20["Llama a ConceptDesignationsRepository.findPropertiesByConcept"]:::llamada
  n19 --> n20
  n21[("LEE terminology.concept_properties")]:::efecto
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

#### 9. POST /terminology/ConceptMap/$translate

UC-03-09: cura o consulta un mapeo entre conceptos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Curar un mapeo exige un rol de terminología |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto origen no encontrado; ResourceNotFoundException: Concepto destino no encontrado; ResourceNotFoundException: El mapeo dejó de existir durante el curado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Curar un mapeo exige declarar la equivalencia; PreconditionFailedException: Un concepto no puede mapearse a sí mismo; PreconditionFailedException: Los conceptos del mapeo tienen que estar activos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptMapsService.translate"]:::llamada
  n2 --> n3
  n4["Llama a ConceptMapsService.curate"]:::llamada
  n3 --> n4
  n5{"!actor.roles.some((role) =› CURATOR_ROLES.includes(role))"}:::decision
  n4 --> n5
  n6(["403 FORBIDDEN Curar un mapeo exige un rol de terminología"]):::error
  n5 -->|"sí"| n6
  n7{"!dto.equivalence"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED Curar un mapeo exige declarar la equivalencia"]):::error
  n7 -->|"sí"| n8
  n9{"targetConceptId === dto.sourceConceptId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Un concepto no puede mapearse a sí mismo"]):::error
  n9 -->|"sí"| n10
  n11["Transacción: transactional(…)"]:::transaccion
  n9 -->|"no"| n11
  n12["Llama a CatalogConceptsRepository.findById"]:::llamada
  n11 --> n12
  n13[("LEE terminology.catalog_concepts")]:::efecto
  n12 --> n13
  n14{"!source"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Concepto origen no encontrado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a CatalogConceptsRepository.findById"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE terminology.catalog_concepts")]:::efecto
  n16 --> n17
  n18{"!target"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND Concepto destino no encontrado"]):::error
  n18 -->|"sí"| n19
  n20["Repite: por cada const [concept, field] de [ [source, 'sourceConceptId'], [target, 'targetCo…"]:::bucle
  n18 -->|"no"| n20
  n21{"concept.stateConceptId !== CONCEPTS.TERM_ACTIVE"}:::decision
  n20 -->|"cada elemento"| n21
  n22(["422 PRECONDITION_FAILED Los conceptos del mapeo tienen que estar activos"]):::error
  n21 -->|"sí"| n22
  n23["Llama a ConceptMapsRepository.findEquivalent"]:::llamada
  n21 -->|"no"| n23
  n20 -->|"al terminar"| n23
  n24[("LEE terminology.concept_maps")]:::efecto
  n23 --> n24
  n25{"duplicate"}:::decision
  n24 --> n25
  n26["Llama a ConceptMapsRepository.findByIdForUpdate"]:::llamada
  n25 -->|"sí"| n26
  n27[("LEE terminology.concept_maps")]:::efecto
  n26 --> n27
  n28{"!locked"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND El mapeo dejó de existir durante el curado"]):::error
  n28 -->|"sí"| n29
  n30[("ACTUALIZA terminology.concept_maps · ACTUALIZA terminology.concept_maps")]:::efecto
  n28 -->|"no"| n30
  n31["Llama a ConceptMapsRepository.create"]:::llamada
  n25 -->|"no"| n31
  n32[("CREA terminology.concept_maps")]:::efecto
  n31 --> n32
  n33["Llama a ConceptMapsService.lookup"]:::llamada
  n30 --> n33
  n32 --> n33
  n34["Llama a CatalogConceptsRepository.findById"]:::llamada
  n33 --> n34
  n35[("LEE terminology.catalog_concepts")]:::efecto
  n34 --> n35
  n36{"!source"}:::decision
  n35 --> n36
  n37(["404 NOT_FOUND Concepto origen no encontrado"]):::error
  n36 -->|"sí"| n37
  n38["Llama a ConceptMapsRepository.findTranslations"]:::llamada
  n36 -->|"no"| n38
  n39[("LEE terminology.concept_maps")]:::efecto
  n38 --> n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. GET /terminology/concepts

UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El conjunto de valores no existe o no tiene versión vigente; ResourceNotFoundException: La etiqueta no existe o no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.searchConcepts"]:::llamada
  n2 --> n3
  n4{"scopingValueSetId === undefined && options.includeValueSets === true"}:::decision
  n3 --> n4
  n5["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n4 -->|"sí"| n5
  n6[("LEE terminology.value_sets")]:::efecto
  n5 --> n6
  n7{"scopingValueSetId !== undefined"}:::decision
  n6 --> n7
  n4 -->|"no"| n7
  n8["Llama a ConceptsService.searchGlossaryPage"]:::llamada
  n7 -->|"sí"| n8
  n9["Llama a ValueSetsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE terminology.value_sets")]:::efecto
  n9 --> n10
  n11["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n10 --> n11
  n12[("LEE terminology.value_set_versions")]:::efecto
  n11 --> n12
  n13{"version === null"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND El conjunto de valores no existe o no tiene versión vigente"]):::error
  n13 -->|"sí"| n14
  n15{"options.tagValueSetId !== undefined"}:::decision
  n13 -->|"no"| n15
  n16["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE terminology.value_set_versions")]:::efecto
  n16 --> n17
  n18{"tagVersion === null"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND La etiqueta no existe o no tiene versión vigente"]):::error
  n18 -->|"sí"| n19
  n20["Llama a CatalogConceptsRepository.searchGlossaryPage"]:::llamada
  n18 -->|"no"| n20
  n15 -->|"no"| n20
  n21{"filters.tagValueSetVersionId !== undefined"}:::decision
  n20 --> n21
  n22[("LEE terminology.value_set_members")]:::efecto
  n21 -->|"sí"| n22
  n23{"normalized !== ''"}:::decision
  n22 --> n23
  n21 -->|"no"| n23
  n24[("LEE terminology.concept_designations")]:::efecto
  n23 -->|"sí"| n24
  n25[("LEE terminology.value_set_members · LEE terminology.catalog_concepts · LEE terminology.concept_designations")]:::efecto
  n24 --> n25
  n23 -->|"no"| n25
  n26["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n25 --> n26
  n27[("LEE terminology.catalog_concepts")]:::efecto
  n26 --> n27
  n28["Llama a ConceptsService.buildSearchItems"]:::llamada
  n27 --> n28
  n29["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n30 --> n31
  n32[("LEE terminology.concept_properties")]:::efecto
  n31 --> n32
  n33{"scopingValueSetId !== undefined"}:::decision
  n32 --> n33
  n7 -->|"no"| n33
  n34["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n33 -->|"sí"| n34
  n35["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n34 --> n35
  n36[("LEE terminology.value_set_versions")]:::efecto
  n35 --> n36
  n37[("LEE terminology.value_set_members")]:::efecto
  n36 --> n37
  n38{"members === null"}:::decision
  n37 --> n38
  n39{"requestedValueSetId !== undefined"}:::decision
  n38 -->|"sí"| n39
  n40(["404 NOT_FOUND El conjunto de valores no existe o no tiene versión vigente"]):::error
  n39 -->|"sí"| n40
  n41["Llama a CatalogConceptsRepository.search"]:::llamada
  n39 -->|"no"| n41
  n38 -->|"no"| n41
  n33 -->|"no"| n41
  n42[("LEE terminology.catalog_concepts")]:::efecto
  n41 --> n42
  n43["Llama a ConceptsService.buildSearchItems"]:::llamada
  n42 --> n43
  n44["Llama a ConceptsService.resolveTexts"]:::llamada
  n43 --> n44
  n45["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n44 --> n45
  n46[("LEE terminology.concept_designations")]:::efecto
  n45 --> n46
  n47["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n46 --> n47
  n48[("LEE terminology.concept_properties")]:::efecto
  n47 --> n48
  n49["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n48 --> n49
  n50[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n49 --> n50
  n51["Llama a ConceptsService.resolveGlossaryTexts"]:::llamada
  n50 --> n51
  n52["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n51 --> n52
  n53[("LEE terminology.concept_properties")]:::efecto
  n52 --> n53
  n54["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n53 --> n54
  n55[("LEE terminology.concept_properties")]:::efecto
  n54 --> n55
  n56["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n55 --> n56
  n57[("LEE terminology.concept_properties")]:::efecto
  n56 --> n57
  n58["Llama a ConceptsService.resolveGlossaryRelations"]:::llamada
  n57 --> n58
  n59["Llama a ConceptRelationshipsRepository.findByTypesForSources"]:::llamada
  n58 --> n59
  n60[("LEE terminology.concept_relationships")]:::efecto
  n59 --> n60
  n61["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n60 --> n61
  n62[("LEE terminology.concept_properties")]:::efecto
  n61 --> n62
  n63(("200 Responde con éxito")):::ok
  n62 --> n63
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. GET /terminology/concepts/{conceptId}

Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.readConcept"]:::llamada
  n2 --> n3
  n4["Llama a CatalogConceptsRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE terminology.catalog_concepts")]:::efecto
  n4 --> n5
  n6{"!concept"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Concepto no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a ConceptsService.resolveTexts"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n8 --> n9
  n10[("LEE terminology.concept_designations")]:::efecto
  n9 --> n10
  n11["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n10 --> n11
  n12[("LEE terminology.concept_properties")]:::efecto
  n11 --> n12
  n13["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n12 --> n13
  n14[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n13 --> n14
  n15["Llama a ConceptDesignationsRepository.findByConcept"]:::llamada
  n14 --> n15
  n16[("LEE terminology.concept_designations")]:::efecto
  n15 --> n16
  n17["Llama a ConceptsService.resolveGlossaryTexts"]:::llamada
  n16 --> n17
  n18["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n17 --> n18
  n19[("LEE terminology.concept_properties")]:::efecto
  n18 --> n19
  n20["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n19 --> n20
  n21[("LEE terminology.concept_properties")]:::efecto
  n20 --> n21
  n22["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n21 --> n22
  n23[("LEE terminology.concept_properties")]:::efecto
  n22 --> n23
  n24["Llama a ConceptsService.resolveGlossaryRelations"]:::llamada
  n23 --> n24
  n25["Llama a ConceptRelationshipsRepository.findByTypesForSources"]:::llamada
  n24 --> n25
  n26[("LEE terminology.concept_relationships")]:::efecto
  n25 --> n26
  n27["Llama a ConceptsService.resolveGlossaryTerms"]:::llamada
  n26 --> n27
  n28["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n27 --> n28
  n29[("LEE terminology.catalog_concepts")]:::efecto
  n28 --> n29
  n30["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n29 --> n30
  n31[("LEE terminology.concept_properties")]:::efecto
  n30 --> n31
  n32["Llama a ConceptDesignationsRepository.findPropertiesByConcept"]:::llamada
  n31 --> n32
  n33[("LEE terminology.concept_properties")]:::efecto
  n32 --> n33
  n34{"isGlossaryTerm && concept.stateConceptId !== CONCEPTS.TERM_ACTIVE"}:::decision
  n33 --> n34
  n35(["404 NOT_FOUND Concepto no encontrado"]):::error
  n34 -->|"sí"| n35
  n36(("200 Responde con éxito")):::ok
  n34 -->|"no"| n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /terminology/concepts/{conceptId}/$deprecate

UC-03-10: retira el concepto y lo excluye de las expansiones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado; ResourceNotFoundException: Concepto de reemplazo no encontrado |
| 409 | `CONFLICT` | ConflictException: Un concepto no puede reemplazarse a sí mismo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El concepto de reemplazo está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.deprecateConcept"]:::llamada
  n2 --> n3
  n4{"dto.replacedByConceptId === conceptId"}:::decision
  n3 --> n4
  n5(["409 CONFLICT Un concepto no puede reemplazarse a sí mismo"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a CatalogConceptsRepository.findByIdForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE terminology.catalog_concepts")]:::efecto
  n7 --> n8
  n9{"!concept"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Concepto no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"dto.replacedByConceptId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a CatalogConceptsRepository.findById"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE terminology.catalog_concepts")]:::efecto
  n12 --> n13
  n14{"!replacement"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Concepto de reemplazo no encontrado"]):::error
  n14 -->|"sí"| n15
  n16{"replacement.stateConceptId === CONCEPTS.TERM_RETIRED"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED El concepto de reemplazo está retirado"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA terminology.catalog_concepts")]:::efecto
  n16 -->|"no"| n18
  n19[("ACTUALIZA terminology.catalog_concepts · ACTUALIZA terminology.catalog_concepts")]:::efecto
  n18 --> n19
  n11 -->|"no"| n19
  n20["Llama a ValueSetsRepository.findMembersByConceptForUpdate"]:::llamada
  n19 --> n20
  n21[("LEE terminology.value_set_members")]:::efecto
  n20 --> n21
  n22["Repite: por cada const member de members"]:::bucle
  n21 --> n22
  n23[("ACTUALIZA terminology.value_set_members")]:::efecto
  n22 -->|"cada elemento"| n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  n22 -->|"al terminar"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /terminology/concepts/{conceptId}/designations

UC-03-05: añade una designación (y opcionalmente propiedades)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.addDesignation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogConceptsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.catalog_concepts")]:::efecto
  n5 --> n6
  n7{"!concept"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Concepto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"dto.preferred"}:::decision
  n7 -->|"no"| n9
  n10["Llama a ConceptDesignationsRepository.findByLanguageForUpdate"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE terminology.concept_designations")]:::efecto
  n10 --> n11
  n12["Repite: por cada const sibling de siblings"]:::bucle
  n11 --> n12
  n13{"sibling.preferred"}:::decision
  n12 -->|"cada elemento"| n13
  n14[("ACTUALIZA terminology.concept_designations")]:::efecto
  n13 -->|"sí"| n14
  n15["Llama a ConceptDesignationsRepository.createDesignation"]:::llamada
  n14 --> n15
  n13 -->|"no"| n15
  n12 -->|"al terminar"| n15
  n9 -->|"no"| n15
  n16[("CREA terminology.concept_designations")]:::efecto
  n15 --> n16
  n17["Repite: por cada const property de properties"]:::bucle
  n16 --> n17
  n18["Llama a ConceptDesignationsRepository.createProperty"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("CREA terminology.concept_properties")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  n17 -->|"al terminar"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. GET /terminology/concepts/{conceptId}/glossary-article

Lee el artículo enciclopédico de un término del glosario

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Artículo del glosario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.readGlossaryArticle"]:::llamada
  n2 --> n3
  n4["Llama a ConceptDesignationsRepository.findProperty"]:::llamada
  n3 --> n4
  n5[("LEE terminology.concept_properties")]:::efecto
  n4 --> n5
  n6{"!property"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Artículo del glosario no encontrado"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. GET /terminology/concepts/{conceptId}/glossary-neighborhood

Lee el vecindario de un término del glosario: relaciones salientes y entrantes agrupadas por tipo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.readGlossaryNeighborhood"]:::llamada
  n2 --> n3
  n4["Llama a ConceptsService.readGlossaryFocus"]:::llamada
  n3 --> n4
  n5["Llama a CatalogConceptsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.catalog_concepts")]:::efecto
  n5 --> n6
  n7{"!concept"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ConceptsService.resolveTexts"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n9 --> n10
  n11[("LEE terminology.concept_designations")]:::efecto
  n10 --> n11
  n12["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n11 --> n12
  n13[("LEE terminology.concept_properties")]:::efecto
  n12 --> n13
  n14["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n13 --> n14
  n15[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n14 --> n15
  n16["Llama a ConceptsService.resolveGlossaryTexts"]:::llamada
  n15 --> n16
  n17["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n16 --> n17
  n18[("LEE terminology.concept_properties")]:::efecto
  n17 --> n18
  n19["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n18 --> n19
  n20[("LEE terminology.concept_properties")]:::efecto
  n19 --> n20
  n21["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n20 --> n21
  n22[("LEE terminology.concept_properties")]:::efecto
  n21 --> n22
  n23{"!isGlossaryTerm || concept.stateConceptId !== CONCEPTS.TERM_ACTIVE || glossaryText?.slug === undefined"}:::decision
  n22 --> n23
  n24(["↩ (relanza el error capturado)"]):::error
  n23 -->|"sí"| n24
  n25["Llama a ConceptRelationshipsRepository.countNeighborsByType"]:::llamada
  n23 -->|"no"| n25
  n26["Llama a ConceptRelationshipsRepository.countNeighborsInDirection"]:::llamada
  n25 --> n26
  n27[("LEE terminology.concept_relationships · LEE terminology.catalog_concepts · LEE terminology.concept_properties")]:::efecto
  n26 --> n27
  n28["Llama a ConceptRelationshipsRepository.countNeighborsInDirection"]:::llamada
  n27 --> n28
  n29[("LEE terminology.concept_relationships · LEE terminology.catalog_concepts · LEE terminology.concept_properties")]:::efecto
  n28 --> n29
  n30["Llama a ConceptsService.collectSortedNeighbors"]:::llamada
  n29 --> n30
  n31["Llama a ConceptRelationshipsRepository.findByTypesForSources"]:::llamada
  n30 --> n31
  n32[("LEE terminology.concept_relationships")]:::efecto
  n31 --> n32
  n33["Llama a ConceptRelationshipsRepository.findByTypesForTargets"]:::llamada
  n32 --> n33
  n34[("LEE terminology.concept_relationships")]:::efecto
  n33 --> n34
  n35["Llama a ConceptsService.resolveGlossaryTerms"]:::llamada
  n34 --> n35
  n36["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n35 --> n36
  n37[("LEE terminology.catalog_concepts")]:::efecto
  n36 --> n37
  n38["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n37 --> n38
  n39[("LEE terminology.concept_properties")]:::efecto
  n38 --> n39
  n40["Llama a ConceptsService.resolveTexts"]:::llamada
  n39 --> n40
  n41["Llama a ConceptDesignationsRepository.findPreferredByLanguageForConcepts"]:::llamada
  n40 --> n41
  n42[("LEE terminology.concept_designations")]:::efecto
  n41 --> n42
  n43["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n42 --> n43
  n44[("LEE terminology.concept_properties")]:::efecto
  n43 --> n44
  n45["Llama a ConceptsService.resolveNeighborCategories"]:::llamada
  n44 --> n45
  n46["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n45 --> n46
  n47[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n46 --> n47
  n48["Llama a ConceptsService.resolveNeighborEvidence"]:::llamada
  n47 --> n48
  n49["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n48 --> n49
  n50[("LEE terminology.catalog_concepts")]:::efecto
  n49 --> n50
  n51["Llama a ConceptRelationshipsRepository.findEvidenceSummaries"]:::llamada
  n50 --> n51
  n52[("LEE terminology.concept_relationship_evidence · LEE terminology.catalog_concepts")]:::efecto
  n51 --> n52
  n53(("200 Responde con éxito")):::ok
  n52 --> n53
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /terminology/concepts/{conceptId}/properties

UC-03-05: alta o actualización de propiedades del concepto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.upsertProperties"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogConceptsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.catalog_concepts")]:::efecto
  n5 --> n6
  n7{"!concept"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Concepto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Repite: por cada const property de dto.properties"]:::bucle
  n7 -->|"no"| n9
  n10["Llama a ConceptDesignationsRepository.findProperty"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE terminology.concept_properties")]:::efecto
  n10 --> n11
  n12{"existing"}:::decision
  n11 --> n12
  n13[("ACTUALIZA terminology.concept_properties · ACTUALIZA terminology.concept_properties")]:::efecto
  n12 -->|"sí"| n13
  n14["Llama a ConceptDesignationsRepository.createProperty"]:::llamada
  n12 -->|"no"| n14
  n15[("CREA terminology.concept_properties")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n13 --> n16
  n15 --> n16
  n9 -->|"al terminar"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /terminology/concepts/{conceptId}/relationships

UC-03-06: crea una relación dirigida entre conceptos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Concepto origen no encontrado; ResourceNotFoundException: Concepto destino no encontrado |
| 409 | `CONFLICT` | ConflictException: Un concepto no puede relacionarse consigo mismo; ConflictException: Ya existe una relación equivalente entre esos conceptos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.addRelationship"]:::llamada
  n2 --> n3
  n4{"dto.targetConceptId === conceptId"}:::decision
  n3 --> n4
  n5(["409 CONFLICT Un concepto no puede relacionarse consigo mismo"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a CatalogConceptsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE terminology.catalog_concepts")]:::efecto
  n7 --> n8
  n9{"!source"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Concepto origen no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13{"!target"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Concepto destino no encontrado"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ConceptRelationshipsRepository.findEquivalent"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE terminology.concept_relationships")]:::efecto
  n15 --> n16
  n17{"duplicate"}:::decision
  n16 --> n17
  n18(["409 CONFLICT Ya existe una relación equivalente entre esos conceptos"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ConceptRelationshipsRepository.create"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA terminology.concept_relationships")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. GET /terminology/concepts/glossary-graph

Lee el grafo de términos publicados del glosario médico

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El conjunto de valores no existe o no tiene versión vigente; ResourceNotFoundException: La etiqueta no existe o no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConceptsService.readGlossaryGraph"]:::llamada
  n2 --> n3
  n4["Llama a ConceptsService.searchConcepts"]:::llamada
  n3 --> n4
  n5{"scopingValueSetId === undefined && options.includeValueSets === true"}:::decision
  n4 --> n5
  n6["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n5 -->|"sí"| n6
  n7[("LEE terminology.value_sets")]:::efecto
  n6 --> n7
  n8{"scopingValueSetId !== undefined"}:::decision
  n7 --> n8
  n5 -->|"no"| n8
  n9["Llama a ConceptsService.searchGlossaryPage"]:::llamada
  n8 -->|"sí"| n9
  n10["Llama a ValueSetsRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE terminology.value_sets")]:::efecto
  n10 --> n11
  n12["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n11 --> n12
  n13[("LEE terminology.value_set_versions")]:::efecto
  n12 --> n13
  n14{"version === null"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND El conjunto de valores no existe o no tiene versión vigente"]):::error
  n14 -->|"sí"| n15
  n16{"options.tagValueSetId !== undefined"}:::decision
  n14 -->|"no"| n16
  n17["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE terminology.value_set_versions")]:::efecto
  n17 --> n18
  n19{"tagVersion === null"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND La etiqueta no existe o no tiene versión vigente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a CatalogConceptsRepository.searchGlossaryPage"]:::llamada
  n19 -->|"no"| n21
  n16 -->|"no"| n21
  n22{"filters.tagValueSetVersionId !== undefined"}:::decision
  n21 --> n22
  n23[("LEE terminology.value_set_members")]:::efecto
  n22 -->|"sí"| n23
  n24{"normalized !== ''"}:::decision
  n23 --> n24
  n22 -->|"no"| n24
  n25[("LEE terminology.concept_designations")]:::efecto
  n24 -->|"sí"| n25
  n26[("LEE terminology.value_set_members · LEE terminology.catalog_concepts · LEE terminology.concept_designations")]:::efecto
  n25 --> n26
  n24 -->|"no"| n26
  n27["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n26 --> n27
  n28[("LEE terminology.catalog_concepts")]:::efecto
  n27 --> n28
  n29{"scopingValueSetId !== undefined"}:::decision
  n28 --> n29
  n8 -->|"no"| n29
  n30["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n29 -->|"sí"| n30
  n31["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_versions")]:::efecto
  n31 --> n32
  n33[("LEE terminology.value_set_members")]:::efecto
  n32 --> n33
  n34{"members === null"}:::decision
  n33 --> n34
  n35{"requestedValueSetId !== undefined"}:::decision
  n34 -->|"sí"| n35
  n36(["404 NOT_FOUND El conjunto de valores no existe o no tiene versión vigente"]):::error
  n35 -->|"sí"| n36
  n37["Llama a CatalogConceptsRepository.search"]:::llamada
  n35 -->|"no"| n37
  n34 -->|"no"| n37
  n29 -->|"no"| n37
  n38[("LEE terminology.catalog_concepts")]:::efecto
  n37 --> n38
  n39["Llama a ConceptsService.buildSearchItems"]:::llamada
  n38 --> n39
  n40["Llama a ValueSetsRepository.findValueSetsByConceptIds"]:::llamada
  n39 --> n40
  n41[("LEE terminology.value_set_members · LEE terminology.value_set_versions · LEE terminology.value_sets")]:::efecto
  n40 --> n41
  n42["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n41 --> n42
  n43[("LEE terminology.concept_properties")]:::efecto
  n42 --> n43
  n44["Llama a ConceptsService.resolveGlossaryRelations"]:::llamada
  n43 --> n44
  n45["Llama a ConceptRelationshipsRepository.findByTypesForSources"]:::llamada
  n44 --> n45
  n46[("LEE terminology.concept_relationships")]:::efecto
  n45 --> n46
  n47["Llama a ConceptsService.resolveGlossaryTerms"]:::llamada
  n46 --> n47
  n48["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n47 --> n48
  n49[("LEE terminology.catalog_concepts")]:::efecto
  n48 --> n49
  n50["Llama a ConceptDesignationsRepository.findPropertyForConcepts"]:::llamada
  n49 --> n50
  n51[("LEE terminology.concept_properties")]:::efecto
  n50 --> n51
  n52(("200 Responde con éxito")):::ok
  n51 --> n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. GET /terminology/import-template

UC-03-03: descarga la plantilla de importación de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN}; ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ImportTemplateService.generate"]:::llamada
  n2 --> n3
  n4{"importProfile === undefined"}:::decision
  n3 --> n4
  n5(["500 INTERNAL {ErrorCode.IMPORT_PROFILE_UNKNOWN}"]):::error
  n4 -->|"sí"| n5
  n6{"generator === undefined"}:::decision
  n4 -->|"no"| n6
  n7(["500 INTERNAL {ErrorCode.IMPORT_FORMAT_UNSUPPORTED}"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. PUT /terminology/tenants/{tenantId}/catalog-policies

UC-03-12: define la política de catálogo del tenant

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Concepto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La política no permite renombrar conceptos; PreconditionFailedException: Sólo un concepto puede ser el valor por omisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a TenantCatalogService.upsertPolicy"]:::llamada
  n2 --> n3
  n4{"aliasWithoutPermission"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La política no permite renombrar conceptos"]):::error
  n4 -->|"sí"| n5
  n6{"defaults.length › 1"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Sólo un concepto puede ser el valor por omisión"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a ValueSetsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE terminology.value_sets")]:::efecto
  n9 --> n10
  n11{"!valueSet"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Conjunto de valores no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a TenantCatalogRepository.findPolicyForUpdate"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE terminology.tenant_catalog_policies")]:::efecto
  n13 --> n14
  n15{"existing"}:::decision
  n14 --> n15
  n16[("ACTUALIZA terminology.tenant_catalog_policies · ACTUALIZA terminology.tenant_catalog_policies · ACTUALIZA ter…")]:::efecto
  n15 -->|"sí"| n16
  n17["Llama a TenantCatalogRepository.createPolicy"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA terminology.tenant_catalog_policies")]:::efecto
  n17 --> n18
  n19{"defaults.length === 1"}:::decision
  n16 --> n19
  n18 --> n19
  n20["Llama a TenantCatalogRepository.findDefaultsForUpdate"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE terminology.tenant_concept_config")]:::efecto
  n20 --> n21
  n22["Repite: por cada const config de previous"]:::bucle
  n21 --> n22
  n23{"config.conceptId !== defaults[0].conceptId"}:::decision
  n22 -->|"cada elemento"| n23
  n24[("ACTUALIZA terminology.tenant_concept_config")]:::efecto
  n23 -->|"sí"| n24
  n25["Repite: por cada const input de concepts"]:::bucle
  n24 --> n25
  n23 -->|"no"| n25
  n22 -->|"al terminar"| n25
  n19 -->|"no"| n25
  n26["Llama a CatalogConceptsRepository.findById"]:::llamada
  n25 -->|"cada elemento"| n26
  n27[("LEE terminology.catalog_concepts")]:::efecto
  n26 --> n27
  n28{"!concept"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND Concepto no encontrado"]):::error
  n28 -->|"sí"| n29
  n30["Llama a TenantCatalogRepository.findConfig"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE terminology.tenant_concept_config")]:::efecto
  n30 --> n31
  n32{"config"}:::decision
  n31 --> n32
  n33[("ACTUALIZA terminology.tenant_concept_config · ACTUALIZA terminology.tenant_concept_config · ACTUALIZA termino…")]:::efecto
  n32 -->|"sí"| n33
  n34["Llama a TenantCatalogRepository.createConfig"]:::llamada
  n32 -->|"no"| n34
  n35[("CREA terminology.tenant_concept_config")]:::efecto
  n34 --> n35
  n36(("200 Responde con éxito")):::ok
  n33 --> n36
  n35 --> n36
  n25 -->|"al terminar"| n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /terminology/value-sets

UC-03-07: crea un conjunto de valores con versión y reglas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un conjunto de valores con ese código interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ValueSetsService.createValueSet"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n4 --> n5
  n6[("LEE terminology.value_sets")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un conjunto de valores con ese código interno"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ValueSetsRepository.createValueSet"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA terminology.value_sets")]:::efecto
  n9 --> n10
  n11["Llama a ValueSetsRepository.createVersion"]:::llamada
  n10 --> n11
  n12[("CREA terminology.value_set_versions")]:::efecto
  n11 --> n12
  n13["Repite: por cada const rule de rules"]:::bucle
  n12 --> n13
  n14["Llama a ValueSetsRepository.createRule"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA terminology.value_set_rules")]:::efecto
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

#### 22. GET /terminology/value-sets/{id}/$expand

UC-03-08: lee la expansión vigente de un conjunto de valores

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Versión del conjunto de valores no encontrada / El conjunto de valores no tiene una versión vigente |
| 409 | `CONFLICT` | ConflictException: La versión no pertenece a ese conjunto de valores |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ValueSetsService.readExpansion"]:::llamada
  n2 --> n3
  n4["Llama a ValueSetsRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE terminology.value_sets")]:::efecto
  n4 --> n5
  n6{"!valueSet"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Conjunto de valores no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a ValueSetsRepository.findVersionById"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE terminology.value_set_versions")]:::efecto
  n8 --> n9
  n10["Llama a ValueSetsRepository.findDefaultVersion"]:::llamada
  n9 --> n10
  n11[("LEE terminology.value_set_versions")]:::efecto
  n10 --> n11
  n12{"!version"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Versión del conjunto de valores no encontrada / El conjunto de valores no tiene una versión vig…"]):::error
  n12 -->|"sí"| n13
  n14{"version.valueSetId !== valueSetId"}:::decision
  n12 -->|"no"| n14
  n15(["409 CONFLICT La versión no pertenece a ese conjunto de valores"]):::error
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findMembersPage"]:::llamada
  n14 -->|"no"| n16
  n17{"filterTokens.length › 0"}:::decision
  n16 --> n17
  n18["Llama a ValueSetsRepository.findMatchingConceptIds"]:::llamada
  n17 -->|"sí"| n18
  n19["Repite: map(…)"]:::bucle
  n18 --> n19
  n20[("LEE terminology.concept_designations")]:::efecto
  n19 -->|"cada elemento"| n20
  n21[("LEE terminology.value_set_members · LEE terminology.catalog_concepts")]:::efecto
  n20 --> n21
  n19 -->|"al terminar"| n21
  n22[("LEE terminology.value_set_members")]:::efecto
  n21 --> n22
  n17 -->|"no"| n22
  n23["Llama a CatalogConceptsRepository.findByIds"]:::llamada
  n22 --> n23
  n24[("LEE terminology.catalog_concepts")]:::efecto
  n23 --> n24
  n25["Llama a ConceptDesignationsRepository.findPropertiesForConcepts"]:::llamada
  n24 --> n25
  n26[("LEE terminology.concept_properties")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. POST /terminology/ValueSet/{id}/$expand

UC-03-08: materializa los miembros de la expansión

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de valores no encontrado; ResourceNotFoundException: Versión del conjunto de valores no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión no pertenece a ese conjunto de valores |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se expanden versiones en borrador o activas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ValueSetsService.expandValueSet"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ValueSetsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.value_sets")]:::efecto
  n5 --> n6
  n7{"!valueSet"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Conjunto de valores no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ValueSetsRepository.findVersionForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE terminology.value_set_versions")]:::efecto
  n9 --> n10
  n11{"!version"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Versión del conjunto de valores no encontrada"]):::error
  n11 -->|"sí"| n12
  n13{"version.valueSetId !== valueSetId"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONFLICT La versión no pertenece a ese conjunto de valores"]):::error
  n13 -->|"sí"| n14
  n15{"version.stateConceptId && !EXPANDABLE_STATES.has(version.stateConceptId)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Sólo se expanden versiones en borrador o activas"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ValueSetsRepository.findRulesByVersion"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE terminology.value_set_rules")]:::efecto
  n17 --> n18
  n19["Llama a ValueSetsService.evaluateRules"]:::llamada
  n18 --> n19
  n20["Repite: por cada const rule de rules"]:::bucle
  n19 --> n20
  n21["Llama a ValueSetsService.evaluateRule"]:::llamada
  n20 -->|"cada elemento"| n21
  n22["Llama a CodeSystemVersionsRepository.findDefaultActiveVersion"]:::llamada
  n21 --> n22
  n23[("LEE terminology.code_system_versions")]:::efecto
  n22 --> n23
  n24["Llama a CatalogConceptsRepository.findByVersion"]:::llamada
  n23 --> n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26["Llama a ValueSetsRepository.deleteMembersByVersion"]:::llamada
  n25 --> n26
  n20 -->|"al terminar"| n26
  n27[("BORRA terminology.value_set_members")]:::efecto
  n26 --> n27
  n28["Repite: por cada const conceptId de selected"]:::bucle
  n27 --> n28
  n29["Llama a ValueSetsRepository.createMember"]:::llamada
  n28 -->|"cada elemento"| n29
  n30[("CREA terminology.value_set_members")]:::efecto
  n29 --> n30
  n31{"dto.activate !== false"}:::decision
  n30 --> n31
  n28 -->|"al terminar"| n31
  n32[("ACTUALIZA terminology.value_set_versions")]:::efecto
  n31 -->|"sí"| n32
  n33{"dto.makeDefault"}:::decision
  n32 --> n33
  n31 -->|"no"| n33
  n34["Llama a ValueSetsRepository.findDefaultVersionsForUpdate"]:::llamada
  n33 -->|"sí"| n34
  n35[("LEE terminology.value_set_versions")]:::efecto
  n34 --> n35
  n36["Repite: por cada const other de previous"]:::bucle
  n35 --> n36
  n37{"other.id !== version.id"}:::decision
  n36 -->|"cada elemento"| n37
  n38[("ACTUALIZA terminology.value_set_versions")]:::efecto
  n37 -->|"sí"| n38
  n39[("ACTUALIZA terminology.value_set_versions")]:::efecto
  n38 --> n39
  n37 -->|"no"| n39
  n36 -->|"al terminar"| n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  n33 -->|"no"| n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. POST /terminology/versions/{versionId}/import

UC-03-03: importa conceptos en una versión en borrador

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede importar en una versión que no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CodeSystemVersionsService.importConcepts"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CodeSystemVersionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.code_system_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"version.stateConceptId !== CONCEPTS.TERM_DRAFT"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED No se puede importar en una versión que no está en borrador"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findExistingCodes"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Repite: por cada const concept de dto.concepts"]:::bucle
  n12 --> n13
  n14["Llama a CatalogConceptsRepository.create"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA terminology.catalog_concepts")]:::efecto
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

#### 25. POST /terminology/versions/{versionId}/import-file

UC-03-03: importa filas desde un archivo, o las valida sin escribir

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: El sistema de codificación de la versión no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el archivo; PreconditionFailedException: Solo se puede importar en una versión en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN}; ImportFileRejectedException: {ErrorCode.IMPORT_EMPTY_FILE}; ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3{"!file"}:::decision
  n2 --> n3
  n4(["422 PRECONDITION_FAILED Falta el archivo"]):::error
  n3 -->|"sí"| n4
  n5["Llama a ConceptFileImportService.importFromFile"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a ConceptFileImportService.requireProfile"]:::llamada
  n5 --> n6
  n7{"profile === undefined"}:::decision
  n6 --> n7
  n8(["500 INTERNAL {ErrorCode.IMPORT_PROFILE_UNKNOWN}"]):::error
  n7 -->|"sí"| n8
  n9{"withoutContent(buffer)"}:::decision
  n7 -->|"no"| n9
  n10(["500 INTERNAL {ErrorCode.IMPORT_EMPTY_FILE}"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ConceptFileImportService.requireFormat"]:::llamada
  n9 -->|"no"| n11
  n12["Intenta"]:::intento
  n11 --> n12
  n13{"error instanceof FormatoNoAdmitidoError"}:::decision
  n12 -->|"si falla"| n13
  n14(["500 INTERNAL {ErrorCode.IMPORT_FORMAT_UNSUPPORTED}"]):::error
  n13 -->|"sí"| n14
  n15(["↩ (relanza el error capturado)"]):::error
  n13 -->|"no"| n15
  n16{"parser === undefined"}:::decision
  n12 --> n16
  n17(["500 INTERNAL {ErrorCode.IMPORT_FORMAT_UNSUPPORTED}"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ConceptFileImportService.requireVersionInDraft"]:::llamada
  n16 -->|"no"| n18
  n19["Llama a CodeSystemVersionsRepository.findById"]:::llamada
  n18 --> n19
  n20[("LEE terminology.code_system_versions")]:::efecto
  n19 --> n20
  n21{"!version"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Versión no encontrada"]):::error
  n21 -->|"sí"| n22
  n23{"version.stateConceptId != null && version.stateConceptId !== CONCEPTS.TERM_DRAFT"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Solo se puede importar en una versión en borrador"]):::error
  n23 -->|"sí"| n24
  n25["Llama a CodeSystemsRepository.findById"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE terminology.code_systems")]:::efecto
  n25 --> n26
  n27{"!codeSystem"}:::decision
  n26 --> n27
  n28(["404 NOT_FOUND El sistema de codificación de la versión no existe"]):::error
  n27 -->|"sí"| n28
  n29["Llama a ConceptFileImportService.readWithParser"]:::llamada
  n27 -->|"no"| n29
  n30["Intenta"]:::intento
  n29 --> n30
  n31(["500 INTERNAL {ErrorCode.IMPORT_FORMAT_UNSUPPORTED}"]):::error
  n30 -->|"si falla"| n31
  n32{"totalRead === 0"}:::decision
  n30 --> n32
  n33(["500 INTERNAL {ErrorCode.IMPORT_EMPTY_FILE}"]):::error
  n32 -->|"sí"| n33
  n34["Llama a ConceptFileImportService.openBatch"]:::llamada
  n32 -->|"no"| n34
  n35[("CREA terminology.catalog_import_batches")]:::efecto
  n34 --> n35
  n36["Llama a ConceptFileImportService.write"]:::llamada
  n35 --> n36
  n37["Repite: ciclo for"]:::bucle
  n36 --> n37
  n38["Transacción: transactional(…)"]:::transaccion
  n37 -->|"cada elemento"| n38
  n39["Llama a CatalogConceptsRepository.findExistingCodes"]:::llamada
  n38 --> n39
  n40[("LEE terminology.catalog_concepts")]:::efecto
  n39 --> n40
  n41["Repite: por cada const row de batch"]:::bucle
  n40 --> n41
  n42["Llama a CatalogConceptsRepository.create"]:::llamada
  n41 -->|"cada elemento"| n42
  n43[("CREA terminology.catalog_concepts")]:::efecto
  n42 --> n43
  n44["Llama a ConceptFileImportService.closeBatch"]:::llamada
  n43 --> n44
  n41 -->|"al terminar"| n44
  n37 -->|"al terminar"| n44
  n45[("LEE terminology.catalog_import_batches · ACTUALIZA terminology.catalog_import_batches")]:::efecto
  n44 --> n45
  n46(("201 Responde con éxito")):::ok
  n45 --> n46
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. POST /terminology/versions/{versionId}/publish

UC-03-04: publica una versión (borrador → activa)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya está publicada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede publicar una versión en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CodeSystemVersionsService.publishVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CodeSystemVersionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE terminology.code_system_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"version.stateConceptId === CONCEPTS.TERM_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La versión ya está publicada"]):::error
  n9 -->|"sí"| n10
  n11{"version.stateConceptId != null && version.stateConceptId !== CONCEPTS.TERM_DRAFT"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Solo se puede publicar una versión en borrador"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA terminology.code_system_versions · ACTUALIZA terminology.code_system_versions")]:::efecto
  n11 -->|"no"| n13
  n14["Llama a CatalogConceptsRepository.findPromotableByVersion"]:::llamada
  n13 --> n14
  n15[("LEE terminology.catalog_concepts")]:::efecto
  n14 --> n15
  n16["Repite: por cada const concept de promoted"]:::bucle
  n15 --> n16
  n17[("ACTUALIZA terminology.catalog_concepts")]:::efecto
  n16 -->|"cada elemento"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  n16 -->|"al terminar"| n18
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
| GET /admin/catalogs/glossary | 200, 400, 401, 403, 429 | 3 |
| GET /terminology/code-systems | 200, 401, 403, 429 | 1 |
| GET /terminology/code-systems/{id}/versions | 200, 400, 401, 403, 429 | 1 |
| GET /terminology/value-sets | 200, 401, 429 | 3 |
| GET /terminology/value-sets/$glossary-facets | 200, 401, 429 | 5 |
