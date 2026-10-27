# ADR-0028: Direcciones multipaís — país, tres niveles administrativos y distrito para cualquier país

## Estado
Propuesto (2026-10-27). Lo de la **etapa 1** ya está en código (mdavila-2001/mantra-core-health-api#1027,
mdavila-2001/mantra-core-health#1501). La **etapa 2** cambia el modelo de datos: entra por el pipeline de
[ADR-0021](ADR-0021-fuente-unica-de-ddl.md) (`.puml` → `SQL/` → base → ORM) y no se aplica sin aprobar este ADR.

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

### Etapa 2 — modelo (propuesta, pendiente de aprobación)

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
