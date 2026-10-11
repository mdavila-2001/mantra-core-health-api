# Reporte — Teléfono del médico por lugar de atención

Fecha: 2026-10-11. Estado: implementación escrita; frontend compilado y observado con simulador. Integración real con API y base pendiente.

## Alcance realizado

- Modelo M14: `contact_phone` nullable en `practice.practitioner_role_assignments`; DDL regenerado y parche aditivo para bases existentes.
- API: el alta de consultorio propio, incluida en el registro público del médico, conserva `ownSite.contactPhone` en la asignación. `GET /practitioners/:profileId/sites` lo devuelve por sede, incluidas sedes ajenas de otros tenants cuando el profesional tiene una asignación activa. `PUT /practitioners/me/sites/:siteId/contact-phone` permite guardarlo o quitarlo sólo con una asignación activa del actor, sin modificar la sede compartida.
- Frontend: campo opcional en «Su consultorio propio» del registro, captura al crear un lugar propio, teléfono visible en cada fila de «Dónde atiendo» y editor para una sede vinculada propia o ajena. El simulador contiene números diferentes para consultorio y clínica.
- El contacto general `workLandline` / `workMobilePhone` queda independiente. Las afiliaciones a establecimientos del padrón que no tienen una asignación `practice_site_id` siguen el flujo existente y no aparecen como sede editable en la API real.

## Evidencia obtenida

- `python3 -S salud-db/gen_ddl.py 14`: salida 0.
- `python3 -S salud-db/check_ddl_sources.py --quiet`: salida 0.
- `corepack yarn typecheck` del frontend: salida 0, después de generar `env.generated.ts` local.
- `corepack yarn ngc -p tsconfig.app.json --noEmit`: salida 0; sólo advertencias NG8113 de componentes ajenos al cambio.
- ESLint dirigido a los cinco archivos TypeScript editados del frontend: salida 0.
- `tsc --noEmit -p tsconfig.build.json` de la API: salida 0 con un archivo temporal de tipos para `@opentelemetry/instrumentation`, ausente en el manifiesto actual; el archivo temporal se retiró. La compilación ordinaria de la API sigue fallando en ese import ajeno al cambio.
- ESLint dirigido a los archivos API: salida 0 con la regla de Prettier desactivada por un error de resolución de PnP al pasar por el directorio con espacios. Prettier `--check` por separado: salida 0 en los mismos archivos.
- `git diff --check` en API y frontend: salida 0.
- Navegación de la interfaz con simulador en 1440, 768 y 375 px. Se abrieron y revisaron las capturas de tabla y editor:
  - [Tabla, 1440](https://github.com/mdavila-2001/mantra-core-health/blob/codex/phone-per-workplace-20261011/docs/trabajo/2026-10-11-telefono-por-sede/evidencia/donde-atiendo-1440.png)
  - [Tabla, 768](https://github.com/mdavila-2001/mantra-core-health/blob/codex/phone-per-workplace-20261011/docs/trabajo/2026-10-11-telefono-por-sede/evidencia/donde-atiendo-768.png)
  - [Tabla, 375](https://github.com/mdavila-2001/mantra-core-health/blob/codex/phone-per-workplace-20261011/docs/trabajo/2026-10-11-telefono-por-sede/evidencia/donde-atiendo-375.png)
  - [Editor, 1440](https://github.com/mdavila-2001/mantra-core-health/blob/codex/phone-per-workplace-20261011/docs/trabajo/2026-10-11-telefono-por-sede/evidencia/editor-telefono-1440.png)

## Pendiente para afirmar funcionamiento real

- La compilación normal de API no queda verde: el intento con `node-modules` agotó el espacio al enlazar dependencias; una instalación temporal PnP permitió revisar el código, pero `corepack yarn typecheck` encontró faltantes de `@jest/globals` en specs y el build encuentra `@opentelemetry/instrumentation` no declarado directamente. Los artefactos PnP del worktree se retiraron al terminar.
- El parche SQL está escrito y no se aplicó a una base local; tampoco se regeneró OpenAPI.
- No se ejecutaron suites de tests: la instrucción de la sesión prohíbe añadir o correr tests salvo pedido explícito. Tampoco se recorrió navegador → API real → PostgreSQL. Las capturas usan el simulador.
- No hay captura del campo del registro en el paso «Su consultorio propio»: el asistente público tiene 16 pasos con validación previa. El campo sí quedó en el esquema de la página y la compilación de plantilla terminó en 0.
- En 375 px, el teléfono largo se parte en dos líneas dentro de la columna Nombre; no se observó desborde lateral nuevo. El encabezado fijo se superpone a la parte superior de la captura del elemento, sin tapar las filas visibles.

## Cambios no realizados

No se cambiaron matrículas, contactos generales del médico ni teléfonos institucionales compartidos. No se aplicó una migración a un entorno externo.
