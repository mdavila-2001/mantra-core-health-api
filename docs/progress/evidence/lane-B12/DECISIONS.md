# Decisiones y ambigüedades — carril B12 (M4 · fichas públicas)

> Se **registran**, no se resuelven por conveniencia (regla 1.2). Vive en la carpeta del carril para que
> dos máquinas no editen el mismo `DECISIONS.md` (regla anti-bloqueo 3).

## Q-03 · D-F — Farmacias 24 h y de turno

- **Pregunta:** ¿«24 h» y «de turno» son **dato del modelo** o vienen de un **calendario externo**?
- **Quién resuelve:** el propietario. **Qué bloquea:** el filtro «24 h / de turno» del directorio y el
  cálculo de `openNow`.
- **Hecho medido:** `pharmacy.pharmacy_sites` no tiene `open_24h`, horario ni turno
  (`database/SQL/24_pharmacy/02_tables.sql:25-42`); `community/dto/public-search.dto.ts:244` declara
  `openNow: boolean | null` y **ningún servicio lo asigna** (la única aparición es el DTO).
  `platform_ops.on_call_*` es la guardia de la plataforma, no de una farmacia.
- **Forma propuesta:**
  - *A — dato del modelo:* `pharmacy_sites.open_24h boolean NULL` + `pharmacy_on_call_shifts
    (pharmacy_site_id, starts_at, ends_at, source_concept_id)`, cargados por la farmacia. `openNow`
    calculable y auditable; alguien tiene que cargar los turnos y caducan.
  - *B — calendario externo:* adapter al turno oficial (colegio de farmacéuticos o municipio). Dato oficial,
    fuente sin confirmar.
  - *C — sólo `open_24h`:* la parte barata y estable; «de turno» queda para después.
  - Cualquiera empieza en el modelo (`diagram_24_pharmacy.puml` → `gen_ddl.py` → `SQL/`), coordinado con M1.
- **Supuesto de este carril:** ninguno. Las lecturas nuevas **no** devuelven horario, 24 h ni turno: el
  contrato del front ya los declara opcionales y sin dato no se inventan. `openNow` sigue `null`.

## Q-05 · Qué significa «sin precio» en un servicio

- **Hecho medido:** `billing.service_catalog.default_price` es `numeric NOT NULL`, así que el modelo no
  puede expresar «sin precio». Los servicios por defecto se siembran con `'0.00'`
  (`src/modules/billing/default-services.ts:28`) y «Mis servicios» lee ese cero como «Definí el precio».
  El front de la ficha pide `price: null` (y `currency: null`) cuando no hay precio publicado, porque un
  `'0.00'` se lee como gratis.
- **Qué se tomó:** en la proyección pública, `default_price = 0` viaja como `price: null, currency: null`.
  No se agrega columna ni marca nueva.
- **A quién confirmar:** propietario. Si algún servicio real es gratuito a propósito, hace falta una marca
  en el modelo para distinguirlo (P30 de `PENDIENTES-BACKEND.md`).

## Q-08 · `haversineKm` duplicado (deuda registrada, no tocada)

- **Hecho medido:** son **cuatro** copias, no tres: `community/services/community-public.service.ts:1473`,
  `pharmacy/services/pharmacy-marketplace.service.ts:355` (sin redondear),
  `pharmacy/services/pharmacy-read.service.ts:535` y
  `pharmacy_inventory/services/pharmacy-inventory-read.service.ts:423`. `docs/PENDIENTES-BACKEND.md:24-29`
  dice «triplicado» y omite la de `community`.
- **Qué se hizo:** nada. Una de las cuatro vive en `community`, fuera del alcance de M4, y consolidar tres
  dejaría la cuarta igual; las lecturas nuevas de este carril no calculan distancias. El encargo dice «si
  no entra, se registra y no se toca».
