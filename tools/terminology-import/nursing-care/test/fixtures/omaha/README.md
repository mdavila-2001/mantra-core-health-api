# Fixtures del Omaha System

Recortes REALES (sin cambios dentro del recorte) de los archivos que bajó `fetch-omaha.mjs` el 2026-10-27.
Se usan sólo en `../omaha.test.mjs`. Los SHA-256 de los archivos completos están en `omaha.meta.json` (se versionan en `data/`).

| Archivo | Origen | Licencia | Recorte |
|---|---|---|---|
| `problemclassificationscheme.excerpt.html` | https://www.omahasystem.org/problemclassificationscheme | dominio público (FAQ, pregunta 1) | del primer párrafo de contenido al cierre del bloque de texto (sin la navegación) |
| `interventionscheme.excerpt.html` | https://www.omahasystem.org/interventionscheme | ídem | de la introducción al último objetivo («other») |
| `faq.excerpt.html` | https://www.omahasystem.org/faq | ídem | preguntas 1 y 2 |
| `omaha-system-prso.webp` | imagen «Omaha System PRSO.jpg» de la página de la PRSO (SHA-256 `e39d2963…7bab`; el servidor la entrega en WebP) | ídem | ninguno |
| `mosug-kbs-2010.pdftotext-excerpt.txt` | `pdftotext -layout` de https://www.omahasystemmn.org/booklet/OmahaSystemKBSRatingSupplement2010_8x11.pdf (© 2010 MOSUG, «may be used without permission») | libre con atribución | portada (copyright), 5 problemas completos (Income, Mental Health, Communication with Community Resources, Healthcare Supervision, Interpersonal Relationships), la lista de 42 problemas con páginas y la guía de modificadores; la viñeta es U+0083 como sale del PDF |
| `loinc-omaha-terms.sample.json` | NLM Clinical Table Search Service, `loinc_items`, `terms=omaha` (una muestra por lista de respuestas + el panel) | LOINC © Regenstrief Institute (licencia gratuita con aviso) | 4 de los 403 términos |
