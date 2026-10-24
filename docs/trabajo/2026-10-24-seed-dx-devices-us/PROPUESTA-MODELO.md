# Propuesta para `mantra-core-technologies/mantra-core-health-model`: catálogo de equipos (fabricante → marca → modelo)

- Fecha: 2026-10-24 · Origen: sesión `justin/seed-dx-devices-us` (equipos de diagnóstico, FDA)
- Estado: **propuesta**. La API no escribe DDL (ADR-0021); esto tiene que decidirse y versionarse en el repo del modelo.

## Qué hay hoy (verificado en el código de la API)

| Dónde | Qué guarda | Limitación |
|---|---|---|
| `diagnostic_units.diagnostic_equipment` | Un equipo **instalado** en una sede: `equipment_type_concept_id` (FK → `terminology.catalog_concepts`), `manufacturer` y `model` como texto libre (`varchar`), `serial_number`, `modality_concept_id`, calibración, estado | Fabricante y modelo son texto libre; no hay catálogo contra el cual validarlos, ni UDI-DI, ni autorización regulatoria |
| `procedures_perioperative.procedure_devices` | Dispositivo usado en un procedimiento: `device_id` (FK → `iam.devices`), lote, serie, `udi_carrier` | `iam.devices` son dispositivos del usuario (sesiones), no equipos médicos |
| `terminology.*` | Conceptos con propiedades | Sirve para el **tipo** de equipo (product code FDA, GMDN, EMDN). No es lugar para fabricantes ni modelos (no son términos, tienen vida comercial propia) |

Lo que esta rama ya deja usable sin cambiar el modelo: el code system `fda-product-code` (3 268 tipos de alcance diagnóstico, con panel, clase, regulación y motivo del recorte) cargado en `terminology.catalog_concepts`. Es a donde ya apunta `diagnostic_equipment.equipment_type_concept_id`.

## Tablas propuestas (esquema nuevo `device_catalog`, o dentro de `diagnostic_units`)

Identificadores en inglés; textos visibles en castellano de usted desde el front.

```text
device_manufacturers
  id uuid pk
  legal_name varchar not null           -- razón social verbatim de la fuente preferida
  normalized_key varchar not null       -- clave de igualdad exacta (no parecido)
  country_code char(2) null             -- ISO 3166-1 alfa-2, sólo si la fuente lo publica
  unique (normalized_key, country_code)

device_manufacturer_identifiers
  id uuid pk
  manufacturer_id uuid fk → device_manufacturers
  scheme varchar not null               -- fda-reg | fei | duns | srn | lei | cnpj | artg-sponsor …
  value varchar not null
  unique (scheme, value)

device_models
  id uuid pk
  manufacturer_id uuid fk → device_manufacturers
  brand_name varchar null               -- marca verbatim
  model varchar null                    -- versión / modelo / catálogo verbatim
  udi_di varchar null unique            -- UDI-DI primaria (GUDID, EUDAMED…)
  device_type_concept_id uuid fk → terminology.catalog_concepts   -- tipo principal (product code FDA, EMDN…)
  risk_class_concept_id uuid null fk → terminology.catalog_concepts

device_model_types                      -- tipos adicionales que publica la misma fuente (GMDN de GUDID, EMDN de EUDAMED)
  device_model_id uuid fk, type_concept_id uuid fk, pk (device_model_id, type_concept_id)

device_authorizations
  id uuid pk
  device_model_id uuid null fk → device_models   -- null si la autorización es de una familia sin modelo resuelto
  manufacturer_id uuid fk → device_manufacturers
  authority varchar not null            -- fda | eu-nb | mhra | anvisa | hc | tga | pmda | nmpa | agemed …
  authorization_type varchar not null   -- 510k | pma | de-novo | eua | listing | ce-certificate | registro …
  authorization_id varchar not null     -- K-number, P-number, número de registro…
  decision_date date null
  status_verbatim varchar null
  unique (authority, authorization_type, authorization_id, device_model_id)

device_source_records                   -- procedencia por fila (la del formato de intercambio común)
  id uuid pk
  source varchar not null               -- fda-510k, fda-gudid, eudamed-udi…
  source_record_id varchar not null
  source_url text not null
  source_version varchar not null
  retrieved_at timestamptz not null
  device_model_id uuid null fk, device_authorization_id uuid null fk, manufacturer_id uuid null fk
  unique (source, source_record_id)
```

Y en `diagnostic_units.diagnostic_equipment`: agregar `device_model_id uuid null` (FK → `device_models`). Se conservan `manufacturer` y `model` en texto libre para equipos que no estén en el catálogo.

## Cómo se carga

El importador de la consolidación (`justin/seed-dx-devices-master`) lee el NDJSON común de las regiones. Hace upsert idempotente por `(source, source_record_id)` con ids deterministas y llena las tablas de arriba. Esta rama ya publica, por fila, todo lo necesario:

- fabricante verbatim e identificadores con esquema (`fda-reg:`, `fei:`, `duns:`);
- país ISO cuando FDA lo da;
- marca, modelo y UDI-DI;
- tipo con su sistema (`fda-product-code`) y GMDN de GUDID en `extra.deviceTypes`;
- autorización con fecha y estado verbatim.

## Preguntas abiertas para el dueño del modelo

1. ¿Esquema nuevo `device_catalog` o tablas dentro de `diagnostic_units`? (Recomendado: esquema propio; el catálogo también lo van a usar farmacia, inventario y perioperatorio.)
2. ¿Quién es dueño del dato: la consolidación global o cada tenant? (Recomendado: catálogo global de solo lectura; los equipos instalados siguen siendo del tenant.)
