<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `content_packs`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 2 (1 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [content_packs](../endpoints/content_packs.md)

## Proceso: content_packs

- **Código:** `content_packs` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 2
- **Actores:** SUPERADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:ContentPacksController` | Operaciones de ContentPacksController que el README no asigna a un caso de uso | GET /admin/content-packs | SUPERADMIN | BAJO | 0 |
|  |  | POST /admin/content-packs/{code}/apply | SUPERADMIN | MEDIO | 49 |

### Diagrama — etapas `ctrl:ContentPacksController`

```mermaid
flowchart LR
  a2(["SUPERADMIN"]):::actor
  t4[("authz.roles")]:::tabla
  t5[("authz.user_role_assignments")]:::tabla
  t6[("chart.specialty_chart_templates")]:::tabla
  t7[("+43 tablas más")]
  subgraph s0["ctrl:ContentPacksController · Operaciones de ContentPacksController que el READ…"]
    o1["GET /admin/content-packs"]:::op
    o3["POST /admin/content-packs/{code}/apply"]:::op
  end
  a2 --> o1
  a2 --> o3
  o3 -->|"LEE"| t4
  o3 -->|"CREA"| t5
  o3 -->|"LEE"| t5
  o3 -->|"ACTUALIZA"| t6
  o3 -->|"CREA"| t6
  o3 -->|"LEE"| t6
  o3 -.-> t7
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /admin/content-packs/{code}/apply

Aplicar un paquete de contenido

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paquete de contenido no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las cuentas de demostración necesitan una contraseña: declarala en la petición o en SEED_DEMO_PASSWORD.; PreconditionFailedException: Las cuentas de demostración no se crean en producción. Si de verdad las querés acá, hace falta habilitarlo explícitamente en el entorno. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: El catálogo del glosario declara el slug "{term.slug}" más de una vez; Error: El directorio declara el código "{facility.code}" más de una vez; Error: El catálogo geográfico declara la sigla "{department.code}" más de una vez; Error: El catálogo geográfico declara el código INE "{municipality.ine}" más de una vez; Error: El municipio "{municipality.name}" ({municipality.ine}) cuelga deldepartamento "{municipality.department}", que no está en el catálogo; Error: El municipio "{municipality.name}" declara el departamento"{municipality.department}" pero su código INE {municipality.ine}corresponde a "{porPrefijo ?? 'ningu…; Error: El catálogo de aseguradoras declara el código "{code}" más de una vez; Error: El nomenclador declara el código "{procedimiento.code}" más de una vez |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ContentPacksService.aplicar"]:::llamada
  n2 --> n3
  n4{"paquete === undefined"}:::decision
  n3 --> n4
  n5(["404 NOT_FOUND Paquete de contenido no encontrado"]):::error
  n4 -->|"sí"| n5
  n6["Llama a ContentPacksService.correr"]:::llamada
  n4 -->|"no"| n6
  n7{"según code"}:::decision
  n6 --> n7
  n8["Llama a GlossarySeedService.run"]:::llamada
  n7 -->|"'GLOSARIO'"| n8
  n9["Llama a GlossarySeedService.assertUniqueSlugs"]:::llamada
  n8 --> n9
  n10["Repite: por cada const term de GLOSSARY_TERMS"]:::bucle
  n9 --> n10
  n11{"seen.has(term.slug)"}:::decision
  n10 -->|"cada elemento"| n11
  n12(["500 INTERNAL El catálogo del glosario declara el slug '{term.slug}' más de una vez"]):::error
  n11 -->|"sí"| n12
  n13["Repite: por cada const entry de GLOSSARY_TAXONOMY"]:::bucle
  n11 -->|"no"| n13
  n10 -->|"al terminar"| n13
  n14[("CREA terminology.value_sets")]:::efecto
  n13 -->|"cada elemento"| n14
  n15["Repite: por cada const entry de GLOSSARY_TAXONOMY"]:::bucle
  n14 --> n15
  n13 -->|"al terminar"| n15
  n16[("CREA terminology.value_set_versions")]:::efecto
  n15 -->|"cada elemento"| n16
  n17["Repite: por cada const term de GLOSSARY_TERMS"]:::bucle
  n16 --> n17
  n15 -->|"al terminar"| n17
  n18[("CREA terminology.catalog_concepts")]:::efecto
  n17 -->|"cada elemento"| n18
  n19["Llama a GlossarySeedService.seedDesignations"]:::llamada
  n18 --> n19
  n17 -->|"al terminar"| n19
  n20["Repite: por cada const term de GLOSSARY_TERMS"]:::bucle
  n19 --> n20
  n21{"!existing.has(preferredId)"}:::decision
  n20 -->|"cada elemento"| n21
  n22[("CREA terminology.concept_designations")]:::efecto
  n21 -->|"sí"| n22
  n23["Repite: forEach(…)"]:::bucle
  n22 --> n23
  n21 -->|"no"| n23
  n24[("CREA terminology.concept_designations")]:::efecto
  n23 -->|"cada elemento"| n24
  n25["Llama a GlossarySeedService.seedProperties"]:::llamada
  n24 --> n25
  n23 -->|"al terminar"| n25
  n20 -->|"al terminar"| n25
  n26["Repite: por cada const term de GLOSSARY_TERMS"]:::bucle
  n25 --> n26
  n27{"!existing.has(slugPropertyId)"}:::decision
  n26 -->|"cada elemento"| n27
  n28[("CREA terminology.concept_properties")]:::efecto
  n27 -->|"sí"| n28
  n29{"!existing.has(clinicalDefinitionId)"}:::decision
  n28 --> n29
  n27 -->|"no"| n29
  n30[("CREA terminology.concept_properties")]:::efecto
  n29 -->|"sí"| n30
  n31{"!existing.has(plainSummaryId)"}:::decision
  n30 --> n31
  n29 -->|"no"| n31
  n32[("CREA terminology.concept_properties")]:::efecto
  n31 -->|"sí"| n32
  n33["Llama a GlossarySeedService.seedMemberships"]:::llamada
  n32 --> n33
  n31 -->|"no"| n33
  n26 -->|"al terminar"| n33
  n34["Repite: por cada const membership de memberships"]:::bucle
  n33 --> n34
  n35[("CREA terminology.value_set_members")]:::efecto
  n34 -->|"cada elemento"| n35
  n36["Llama a GlossarySeedService.seedRelationships"]:::llamada
  n35 --> n36
  n34 -->|"al terminar"| n36
  n37["Repite: por cada const row de resolved"]:::bucle
  n36 --> n37
  n38[("CREA terminology.concept_relationships")]:::efecto
  n37 -->|"cada elemento"| n38
  n39["Llama a BoliviaFacilitiesSeedService.run"]:::llamada
  n7 -->|"'ESTABLECIMIENTOS_BO'"| n39
  n40["Llama a BoliviaFacilitiesSeedService.assertUniqueCodes"]:::llamada
  n39 --> n40
  n41["Repite: por cada const facility de BOLIVIA_FACILITIES"]:::bucle
  n40 --> n41
  n42{"vistos.has(facility.code)"}:::decision
  n41 -->|"cada elemento"| n42
  n43(["500 INTERNAL El directorio declara el código '{facility.code}' más de una vez"]):::error
  n42 -->|"sí"| n43
  n44{"!(await this.existingIds(em, ValueSets, [valueSetIdentifier])).has( valueSetIdentifier, )"}:::decision
  n42 -->|"no"| n44
  n41 -->|"al terminar"| n44
  n45[("CREA terminology.value_sets")]:::efecto
  n44 -->|"sí"| n45
  n46{"!(await this.existingIds(em, ValueSetVersions, [versionIdentifier])).has( versionIdentifier, )"}:::decision
  n45 --> n46
  n44 -->|"no"| n46
  n47[("CREA terminology.value_set_versions")]:::efecto
  n46 -->|"sí"| n47
  n48["Llama a BoliviaFacilitiesSeedService.seedConcepts"]:::llamada
  n47 --> n48
  n46 -->|"no"| n48
  n49["Repite: por cada const facility de BOLIVIA_FACILITIES"]:::bucle
  n48 --> n49
  n50[("CREA terminology.catalog_concepts")]:::efecto
  n49 -->|"cada elemento"| n50
  n51["Llama a BoliviaFacilitiesSeedService.seedProperties"]:::llamada
  n50 --> n51
  n49 -->|"al terminar"| n51
  n52["Repite: por cada const propiedad de declaradas"]:::bucle
  n51 --> n52
  n53[("CREA terminology.concept_properties")]:::efecto
  n52 -->|"cada elemento"| n53
  n54["Llama a BoliviaFacilitiesSeedService.seedMemberships"]:::llamada
  n53 --> n54
  n52 -->|"al terminar"| n54
  n55["Repite: por cada const facility de BOLIVIA_FACILITIES"]:::bucle
  n54 --> n55
  n56[("CREA terminology.value_set_members")]:::efecto
  n55 -->|"cada elemento"| n56
  n57["Llama a BoGeographySeedService.run"]:::llamada
  n7 -->|"'ASEGURADORAS_BO'"| n57
  n58["Llama a BoGeographySeedService.assertUniqueCodes"]:::llamada
  n57 --> n58
  n59["Repite: por cada const department de BO_DEPARTMENTS"]:::bucle
  n58 --> n59
  n60{"vistas.has(department.code)"}:::decision
  n59 -->|"cada elemento"| n60
  n61(["500 INTERNAL El catálogo geográfico declara la sigla '{department.code}' más de una vez"]):::error
  n60 -->|"sí"| n61
  n62["Repite: por cada const municipality de BO_MUNICIPALITIES"]:::bucle
  n60 -->|"no"| n62
  n59 -->|"al terminar"| n62
  n63{"codigos.has(municipality.ine)"}:::decision
  n62 -->|"cada elemento"| n63
  n64(["500 INTERNAL El catálogo geográfico declara el código INE '{municipality.ine}' más de una vez"]):::error
  n63 -->|"sí"| n64
  n65{"!siglas.has(municipality.department)"}:::decision
  n63 -->|"no"| n65
  n66(["500 INTERNAL El municipio '{municipality.name}' ({municipality.ine}) cuelga deldepartamento '{municipality.de…"]):::error
  n65 -->|"sí"| n66
  n67{"porPrefijo !== municipality.department"}:::decision
  n65 -->|"no"| n67
  n68(["500 INTERNAL El municipio '{municipality.name}' declara el departamento'{municipality.department}' pero su có…"]):::error
  n67 -->|"sí"| n68
  n69{"!existingValueSets.has(valueSetIdentifier)"}:::decision
  n67 -->|"no"| n69
  n62 -->|"al terminar"| n69
  n70[("CREA terminology.value_sets")]:::efecto
  n69 -->|"sí"| n70
  n71["… el resto del árbol (20 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n69 -->|"no"| n71
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
| GET /admin/content-packs | 200, 401, 403, 429 | 0 |
