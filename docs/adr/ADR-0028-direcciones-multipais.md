# ADR-0028: Direcciones multipaís — país, tres niveles administrativos y distrito para cualquier país

## Estado
Aceptado (2026-10-27). Etapa 1 en mdavila-2001/mantra-core-health-api#1030 y
mdavila-2001/mantra-core-health#1506. Etapa 2 implementada como se describe en
«Implementación» (modelo v4.2.63).

## Contexto

El pedido del cliente del 27/10/2026 tiene dos partes que conviven:

1. **Hoy se opera sólo en Bolivia**, y la pantalla lo tiene que decir cuando alguien marca un punto afuera.
2. **La arquitectura tiene que servir para cualquier país del mundo**, con la misma granularidad que hoy tiene
   Bolivia: país → departamento → provincia → municipio → distrito o zona → calle.

Lo que había hasta este ADR estaba atado a Bolivia en cuatro lugares:

| Dónde | Atadura |
|---|---|
| `POST /public/geo/reverse` | Rechazaba (400) todo punto fuera del recuadro de Bolivia |
| Front, `app-map-location-picker` | Decidía «es Bolivia» por ese mismo recuadro, que incluye Puno, Arica y parte de Mato Grosso |
| Catálogos | `VS_BO_DEPARTMENT` y `VS_BO_MUNICIPALITY`: dos value sets con el país en el nombre |
| `common.addresses` | `country_concept_id` (sí, obligatorio), `administrative_area_concept_id` (nivel 1) y `municipality_concept_id`; **no** hay nivel 2 ni distrito |

## Decisiones

### Etapa 1 — contrato y front (hecha)

1. **La geocodificación acepta cualquier punto del planeta** (lat ±90, lng ±180). El abuso lo frenan el tope de 20
   por minuto por IP y la cola con tope del servicio, no un recuadro.
2. **La respuesta trae el país y los niveles**, con nombres neutros y no bolivianos:
   `countryCode` (ISO 3166-1 alfa-2) y `adminAreas: { level1, level2, level3, district }`.
   - `level1` = departamento / estado / región (OSM `state` → `region` → `province`).
   - `level2` = provincia / condado (OSM `county` → `state_district`).
   - `level3` = municipio / ciudad (OSM `municipality` → `city` → `town` → `village` → `hamlet`).
   - `district` = distrito o zona (OSM `city_district` → `suburb` → `borough` → `quarter`).
   Un nivel que el proveedor no conoce **no viene**: no se rellena con el de al lado.
3. **Dónde se opera es una lista, no un recuadro**: `OPERATING_COUNTRIES` en el front
   (`core/data-access/geo/operating-countries.ts`, hoy `['BO']`). El país lo da la API; el recuadro de Bolivia
   queda sólo como respaldo cuando la API no respondió.
4. **El aviso dice la verdad del negocio**: «Por el momento sólo operamos en Bolivia». La calle y el distrito
   igual se muestran, porque el dato existe para cualquier país.

### Etapa 2 — modelo

5. **Un catálogo jerárquico de divisiones administrativas para todos los países**, en lugar de un value set por
   país y nivel:
   - Un concepto por división, con `country` (ISO 3166-1), `level` (1, 2, 3), `parent` (la división del nivel
     anterior) y código estable: ISO 3166-2 donde exista (`BO-S` para Santa Cruz), y el código oficial del país
     para los niveles que ISO no cubre (para Bolivia, el código INE del municipio que ya usa `VS_BO_MUNICIPALITY`).
   - `VS_BO_DEPARTMENT` y `VS_BO_MUNICIPALITY` pasan a ser **vistas** de ese catálogo (país = BO, nivel 1 y 3),
     para no romper a ningún consumidor.
6. **`common.addresses` gana dos columnas**, ambas opcionales para que el cambio sea compatible hacia atrás:
   `administrative_area_2_concept_id` (nivel 2) y `district_text` (el distrito como texto: ningún catálogo
   oficial cubre los distritos de todos los países, y no se inventa uno).
7. **Fuente del catálogo, con procedencia** (regla 97.4): ISO 3166-1 y 3166-2 para países y nivel 1;
   [geoBoundaries](https://www.geoboundaries.org/) (CC BY 4.0) para los niveles 2 y 3 con geometría. Se importa
   por país habilitado, no el planeta entero de una vez: habilitar un país es importar su catálogo y sumar su
   código a `OPERATING_COUNTRIES`.
8. **Del punto al concepto**: la geometría del país habilitado vive en el front, como hoy la de Bolivia
   (municipio sin red). El nombre que da el geocodificador **no** se usa para elegir un concepto del catálogo:
   un nombre de OSM no es un código, y casarlo por texto elegiría mal en silencio.

## Consecuencias

- Sumar un país deja de ser tocar el selector: es importar su catálogo (etapa 2) y agregar su código a la lista.
- Mientras la etapa 2 no exista, un punto fuera de Bolivia muestra calle y distrito, pero no puede guardar
  municipio. Es lo correcto hoy: el cliente opera sólo en Bolivia.
- El contrato de `POST /public/geo/reverse` sólo agregó campos opcionales y amplió rangos: no rompe clientes.

## Alternativas descartadas

- **Un value set por país y nivel** (`VS_AR_PROVINCE`, `VS_PE_DISTRICT`…): multiplica catálogos y obliga a
  tocar código por cada país nuevo.
- **Guardar sólo el texto que devuelve el geocodificador**: no se puede filtrar, agrupar ni validar, y cambia
  cuando el proveedor cambia un nombre.
- **Mantener el recuadro de Bolivia**: confunde con Bolivia puntos de Perú, Chile, Argentina, Paraguay y Brasil
  que caen adentro.

## Implementación de la etapa 2

- **Modelo (v4.2.63)**: `common.addresses.administrative_area_2_concept_id`
  (FK a `terminology.catalog_concepts`, índice propio) y `district_text`. Declaradas
  en `diagram_02_common.puml` y en la bóveda (`SALUD/FK/FK common.addresses.
  administrative_area_2_concept_id.md`); `gen_ddl.py` las emite, y el patch
  idempotente `SQL/patches/2026-10-27_v4263_addresses_nivel2_y_distrito.sql` las
  agrega a una base viva.
- **Catálogo**: el árbol no necesitó tablas nuevas. `VS_ADMIN_DIVISION` es un
  conjunto de valores de terminología cuyos conceptos llevan tres propiedades
  iguales para todo país: `geo:country`, `geo:level` y `geo:parent`. Lo declara
  `src/common/seed/admin-divisions.catalog.ts` y lo siembra
  `AdminDivisionsSeedService`, inmediatamente después de la geografía de Bolivia.
  Bolivia aporta 9 departamentos y 340 municipios —los **mismos conceptos** de
  `VS_BO_DEPARTMENT` y `VS_BO_MUNICIPALITY`, que siguen intactos— y 112 provincias
  nuevas, derivadas del código INE `DDPP` de los municipios. Sumar un país es
  sumar su entrada a `ADMIN_DIVISIONS_BY_COUNTRY`.
- **Fuente de un país nuevo**: la decisión 7 sigue en pie (ISO 3166-2 y
  geoBoundaries, con procedencia). Bolivia no la necesitó: su árbol ya estaba en
  el catálogo del INE que la API siembra.
- **Escritura**: el servidor **deduce** la provincia del municipio
  (`adminDivisionLineage`), igual que ya deducía el departamento; no la recibe del
  cliente. El distrito llega como texto (`homeDistrict` y `workDistrict` en el alta
  y el perfil del paciente y en el perfil del profesional, `homeDistrict` en el
  alta del profesional, `district` en la libreta de direcciones y en la dirección
  del consultorio propio) y se guarda en `district_text`, sin pegarse a `lines`.
  Las lecturas de dirección devuelven `administrativeArea2ConceptId` y `district`.
- **Consultorio propio** (mdavila-2001/mantra-core-health-api#1036): su dirección
  también es una fila de `common.addresses` (`practice.practice_sites.address_id`),
  así que no hizo falta tocar el modelo. El alta y la mudanza de la sede guardan
  la provincia deducida y el distrito; los textos de la sede y de la ficha pública
  componen líneas, distrito y ciudad, para que el distrito no se pierda al dejar de
  ir dentro de la línea.
