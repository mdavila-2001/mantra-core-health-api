# Fuentes — repositorio universal de servicios

Investigación completa (32 fuentes evaluadas, 18 descargadas, ranking y licencias con cita):
[`docs/trabajo/2026-10-27-repositorio-universal-servicios/investigacion/fuentes/FUENTES.md`](../../../docs/trabajo/2026-10-27-repositorio-universal-servicios/investigacion/fuentes/FUENTES.md).

Las fuentes crudas **no** viven en git: se leen de `$SERVICE_REPOSITORY_SOURCES_DIR`
(por defecto `../servicios-build/sources/` junto al repo) y cada adaptador aborta si el
SHA-256 no coincide. El corpus normalizado sí vive en `data/` (con `MANIFEST.json`).

## Cargadas (corpus 2026-11-01: 15 882 servicios)

| Adaptador | Fuente | Organismo | Ítems | Licencia | SHA-256 del archivo |
|---|---|---|---:|---|---|
| `co-pbs-procedimientos` | Procedimientos del PBS (datos.gov.co `9zcz-bjue`) — CUPS con «Qué es» | MinSalud Colombia | 8 114 | **CC BY-SA 4.0** (ver aviso) | `4a8ed7ff…0636` |
| `cl-fonasa-mle-2026` | Arancel FONASA MLE 2026 (copia npm cotejada 596/596 contra el PDF oficial) | FONASA, Chile | 2 515 | Documento público del Estado de Chile | `b622019b…e05c` |
| `ar-pami-nomenclador` | Nomenclador Común de prácticas (feb. 2019) | INSSJP-PAMI, Argentina | 4 681 (de 4 739; 58 de internación/insumos excluidos) | CC BY 4.0 | `07370b31…80b4` |
| `mantra-curado` | Listas de control por especialidad con fuente citada (`investigacion/checklists/`) | Curación propia | 572 nuevos + 758 adjuntados a CUPS/FONASA | Curación propia; cada ítem cita su fuente | — |

Más lo que ya estaba: arancel boliviano (`VS_BO_MEDICAL_PROCEDURE`, 4 408) y
`specialty-services/` (relaciones servicio → especialidad).

> [!aviso] CC BY-SA 4.0 (PBS Colombia)
> Del PBS se usa el nombre y la definición en lenguaje llano. ShareAlike obliga a
> publicar bajo la misma licencia **el material adaptado que se distribuya**. Si el
> producto expone esas definiciones fuera de la plataforma (exportaciones, API pública),
> producto/legal debe decidir si se acepta o si se retira `definition` de esos conceptos.
> La atribución viaja en la propiedad `service-repository:source.definitionSource`.

## Descargadas y todavía sin adaptador

CUPS 2026 oficial (Res. 2706/2025, PDF), CIE-10-ES Procedimientos 2026 (78 948, nombres
técnicos: capa de mapeo, no de tienda), órdenes de precios públicos de Murcia, Osakidetza,
Andalucía, Madrid, Valencia, ICS, Canarias, INGESA y Galicia, y prestaciones dentarias de
ISFAS. Contrato para escribirlos: [ADAPTERS.md](ADAPTERS.md).

## Descartadas

SNOMED CT (Bolivia no es miembro), CPT y CDT (propietarias), MBS Australia (uso personal no
comercial), WHO ICHI (CC BY-ND), CPMS Perú y tarifario de Ecuador (derivados de CPT),
SIGTAP/OPS/OPCS-4/CCAM (idioma). Detalle en FUENTES.md.
