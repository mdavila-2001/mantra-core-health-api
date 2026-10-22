<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `public`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 2 (2 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [public](../endpoints/public.md)

## Proceso: Public catalog module

- **Código:** `public` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 2
- **Actores:** Público (sin sesión)
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/public/README.md`

### Para qué sirve

Expone sin sesión los catálogos de servicios de organizaciones y de productos de farmacias que tienen una ficha pública activa. Las consultas usan paginación por cursor, límite de 50 y rate limit de 60 solicitudes por minuto.

_Fuente: `src/modules/public/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:PublicCatalogController` | Operaciones de PublicCatalogController que el README no asigna a un caso de uso | GET /public/profiles/f/{slug}/products | Público (sin sesión) | BAJO | 9 |
|  |  | GET /public/profiles/o/{slug}/services | Público (sin sesión) | BAJO | 4 |

### Diagrama — etapas `ctrl:PublicCatalogController`

```mermaid
flowchart LR
  a2(["Público (sin sesión)"]):::actor
  t3[("community.public_profiles")]:::tabla
  t4[("pharmacy_inventory.inventory_locations")]:::tabla
  t5[("pharmacy_inventory.inventory_stock_positions")]:::tabla
  t6[("pharmacy.pharmacies")]:::tabla
  t7[("pharmacy.pharmacy_price_lists")]:::tabla
  t8[("pharmacy.pharmacy_product_prices")]:::tabla
  t11[("billing.service_catalog")]:::tabla
  t12[("practice.practices")]:::tabla
  t13[("terminology.catalog_concepts")]:::tabla
  t9[("+3 tablas más")]
  subgraph s0["ctrl:PublicCatalogController · Operaciones de PublicCatalogController que el RE…"]
    o1["GET /public/profiles/f/{slug}/products"]:::op
    o10["GET /public/profiles/o/{slug}/services"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  o1 -.-> t9
  a2 --> o10
  o10 -->|"LEE"| t11
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t13
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /public/profiles/f/{slug}/products

Productos que ofrece una farmacia, desde su ficha pública

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PublicCatalogService.pharmacyProducts"]:::llamada
  n2 --> n3
  n4["Llama a PublicCatalogService.typeProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicCatalogRepository.findVisibleProfileBySlug"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"profile === null || profile.targetTypeConceptId !== kind"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND No encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PublicCatalogRepository.findPharmacyProducts"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE pharmacy.pharmacy_products · LEE pharmacy.pharmacies · LEE terminology.catalog_concepts · LEE pharmacy.ph…")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /public/profiles/o/{slug}/services

Servicios que ofrece una organización, desde su ficha pública

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PublicCatalogService.organizationServices"]:::llamada
  n2 --> n3
  n4["Llama a PublicCatalogService.typeProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicCatalogRepository.findVisibleProfileBySlug"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"profile === null || profile.targetTypeConceptId !== kind"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND No encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PublicCatalogRepository.findOfferedServices"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE billing.service_catalog · LEE practice.practices · LEE terminology.catalog_concepts")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

