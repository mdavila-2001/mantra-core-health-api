# `data/specialty-services/` — reglas de evidencia especialidad → servicio

Lo **curado a mano** del catálogo de servicios por especialidad. El corpus en sí
(miles de servicios) no está acá: lo arma y lo carga el importador
[`tools/terminology-import/specialty-services/`](../../../../../tools/terminology-import/specialty-services/SOURCES.md)
desde fuentes fuera de git. Ningún seed del arranque lee estos archivos.

| Archivo                  | Qué es                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rules.json`             | Las reglas que deciden a qué especialidad pertenece un servicio. Hay dos bases: **sección de la fuente** (el arancel lo agrupa bajo un encabezado que nombra la especialidad) y **descriptor** (el propio texto dice quién presta: «… por especialista en cardiología»). Cada asignación declara su tipo de equivalencia (`exact`, `reordered`, `national-name`, `section-content`) y, si no es literal, una nota con la razón. |
| `model-specialties.json` | Foto de `VS_MEDICAL_SPECIALTY` (63 especialidades) tal como la declara el paquete de seeds del modelo, con el commit de origen. Sólo sirve para validar las reglas; el cargador resuelve cada especialidad por código contra la base.                                                                                                                                                                                           |
| `rules.spec.ts`          | Cada código que nombran las reglas existe en esa foto; toda equivalencia no literal tiene nota; las frases ya están normalizadas.                                                                                                                                                                                                                                                                                               |

## Reglas que no se negocian

- **Sin fuente no hay relación.** No se infiere por anatomía («ecografía
  ginecológica» no dice quién la hace) ni por parecido de nombres.
- **`specialty: null` es un hueco, no un error.** La fuente nombra una
  especialidad que el modelo no tiene (Neurocirugía, Cirugía Plástica…): queda
  contada en el reporte y propuesta al repo del modelo; nunca se reasigna a la
  especialidad «más parecida». Por eso «Nefrología pediátrica» no cae en
  Nefrología.
- **La frase se busca entera.** Lo que sigue al patrón de prestador se compara
  completo contra la tabla, con sólo los recortes declarados en `trailingCut`
  («(1RA CONSULTA)», «ADULTOS»…).

Cambiar una regla cambia el corpus: subí `version` y documentá el motivo en
[`docs/seed-research/specialty-services.md`](../../../../../docs/seed-research/specialty-services.md).
