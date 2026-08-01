# Relaciones entre entidades

> Fase 11. **6616 foreign keys** declaradas en el catálogo (`src/orm/catalog/foreign-keys/`),
> **5278 (80%) cross-schema** — el modelo es intencionalmente muy interconectado entre dominios
> a nivel de dato, aunque el código de aplicación mantenga aislamiento de dominio a nivel de
> repositorio (ver [ARCH-001..004](../governance/traceability-matrix.md)). Esto es coherente: los
> **datos** están relacionados (una factura referencia un paciente, un tenant, un concepto), pero
> el **código** de un módulo no debe leer el repositorio de otro directamente — el dato se
> relaciona vía la base, el código se relaciona vía servicios.

## Las dos tablas más referenciadas del sistema (fan-in)

| Tabla destino | Veces referenciada | Lectura |
|---|---:|---|
| `terminology.catalog_concepts` | **2404** | Todo valor cerrado del modelo (estado, tipo, categoría) apunta aquí — la materialización a escala de la regla "terminología en vez de enums" ([ADR-0002](../adr/ADR-0002-orm-mikroorm.md)). |
| `iam.users` | **1775** | Los campos de auditoría compartidos (`created_by_user_id`/`updated_by_user_id`) de prácticamente toda tabla de negocio apuntan aquí. |
| `directory.tenants` | 283 | Aislamiento multi-tenant — ver [ADR-0006](../adr/ADR-0006-multi-tenancy-rls.md). |
| `common.files` | 78 | Adjuntos genéricos compartidos entre dominios. |
| `profiles.health_practitioner_profiles` / `profiles.patient_profiles` | 73 / 70 | Los dos sujetos centrales del dominio clínico. |
| `practice.practices` | 46 | Unidad organizativa de práctica. |

## Pares de schemas más conectados (top 15, excluyendo `terminology`/`iam` como destino)

| Origen → Destino | FKs | Lectura de negocio |
|---|---:|---|
| `erp` → `accounting` | 41 | Costos/activos ERP se contabilizan en el libro mayor |
| `billing` → `accounting` | 27 | Facturación alimenta contabilidad |
| `diagnostics` → `profiles` | 25 | Resultados diagnósticos referencian al paciente/profesional |
| `procedures_perioperative` → `profiles` | 24 | Casos quirúrgicos referencian sujetos clínicos |
| `clinical` → `profiles` | 23 | Encuentros clínicos referencian sujetos clínicos |
| `pharmacy_inventory` → `pharmacy` | 23 | Inventario referencia el catálogo de productos farmacéuticos |
| `procedures_perioperative` → `clinical` | 23 | Perioperatorio referencia encuentros clínicos |
| `accounting` → `erp` | 21 | Relación bidireccional con `erp` (contrapartida de la fila 1) |
| `diagnostics` → `clinical` | 21 | Resultados diagnósticos referencian el encuentro clínico origen |
| `erp` → `directory` | 21 | Entidades ERP referencian tenant/organización |
| `accounting` → `directory` | 17 | Contabilidad referencia tenant |
| `billing` → `erp` | 17 | Facturación referencia contrapartes/contratos ERP |
| `clinical` → `directory` | 17 | Clínica referencia tenant |
| `health_data` → `directory` | 17 | Datos de salud referencian tenant |
| `payments` → `directory` | 17 | Pagos referencian tenant |

Patrón consistente: la mayoría de pares cruzados son **financiero↔financiero** (erp/accounting/billing)
o **clínico→identidad de sujeto** (`profiles`) — coherente con
[capacidades de negocio](../business/capabilities.md) y sin sorpresas frente al mapa de
dependencias de código.

**`terminology` e `iam` como destino dominan el conteo global** (ver tabla de fan-in arriba) porque son
los dos "servicios de plataforma" de datos que casi todo dominio consume — no indican
acoplamiento de negocio entre, por ejemplo, `ads` y `procedures_perioperative`, solo que ambos usan
el mismo catálogo de conceptos y el mismo directorio de usuarios.

## Cómo leer esto junto con `docs/architecture/module-dependencies.md`

`docs/architecture/module-dependencies.md` (Graphify) mide acoplamiento de **código** (imports,
llamadas). Esta página mide acoplamiento de **datos** (foreign keys). Son complementarias, no
redundantes: un módulo puede tener una FK real hacia `terminology` sin importar ningún archivo de
ese módulo — la relación vive enteramente en el esquema de base de datos, resuelta por el ORM sin
acoplar el código TypeScript.

## Fuente y regeneración

`src/orm/catalog/foreign-keys/*.fk.ts`, generado por `yarn orm:catalog` desde la bóveda de diseño
SALUD (ver [arquitectura de datos](data-architecture.md) §"Fuente de verdad del modelo de
diseño"). Esta página se recalcula manualmente contra esa misma fuente — no hay script dedicado
de `relationships.md` en esta fase; si el modelo cambia sustancialmente, regenerar las cifras
consultando `tools/catalog/lib/vault.mjs` → `readVault().foreignKeys`.
