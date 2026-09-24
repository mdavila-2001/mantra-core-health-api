# Verificaciones API — 2026-09-24

Entorno: worktree justin/medical-module-cierre-api, datos de prueba sintéticos, proyecto Docker desechable mch-medical-20260924. Nunca se leyó ni usó el .env administrado. La rama documental se publicó en origin; no hay PR, merge ni deploy.

- typecheck: exit 0.
- lint: exit 0.
- OpenAPI lint: exit 0; openapi.yaml validated in 1262ms; API description is valid.
- OpenAPI breaking-check tests: 20 aprobados; no cambios de contrato.
- Suites unitarias dirigidas: 21 suites, 505 pruebas aprobadas.
- practitioner-registration.int-spec.ts: 8/8 aprobadas después de cargar semillas canónicas sintéticas parciales.
- Suite unitaria completa con heap de 6144 MB: FATAL ERROR por JavaScript heap out of memory; no resumen.
- Suite de integración: 12 suites fallidas, 1 omitida, 1 aprobada; 90 pruebas fallidas, 8 omitidas, 26 aprobadas. El log muestra ECONNREFUSED 127.0.0.1:55433.
- Init DDL canónica: falla con código 3 en patch de aseguradoras porque espera 17 filas de catálogo y observa 0. El orden del proceso de seed es posterior.
- Init experimental no canónica: una copia temporal omitió únicamente ese patch y llegó a 1260 tablas. Esta salida no reemplaza ni aprueba la init canónica.
- Semillas modelo: paquete oficial, módulo 03 únicamente; 1369 conceptos; 7104 referencias huérfanas advertidas al no cargar otros módulos.
- El daemon Docker dejó de responder y los puertos de los proyectos aislados quedaron cerrados. No se reinició.

Las salidas crudas completas permanecieron en /tmp durante la sesión; este resumen preserva comandos/resultados relevantes sin logs PHI ni datos de pacientes. No se generaron capturas clínicas.
