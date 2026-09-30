# Plan M7 · H2 (API) — Alta y perfil del profesional, altas de instituciones

Base: `origin/test` @ 435cd290. Rama: `legion/test-h2-alta-perfil-instituciones`.
Alcance IN: BR-07 (Parte 1: verificar lo ya mergeado de #453; Parte 2: ID-07, 08, 09, 12, 13), BR-08 (ID-10 parcial, ID-11, ID-16), BR-09 (ID-17, CL-42, CL-43).
Alcance OUT: `@Roles` existentes, role-mapping (M2); clinical (M3); scheduling/pharmacy/billing (M4); DDL y `db:vendor` (M1).

| Microtarea | Criterio | Prueba |
|---|---|---|
| ID-07 PATCH/DELETE especialidad propia | 204 / 404 ajena / 422 no pendiente / 400 con `isPrimary` | spec de servicio y de DTO; ruta mapeada |
| ID-08 PATCH/DELETE matrícula propia | igual; 422 con caso abierto o historial de auditoría | ídem |
| ID-09 `licenses[].fileId` | sólo lectura propia | spec de servicio |
| ID-13 sexo y departamento emisor | 200; departamento fuera de `VS_BO_DEPARTMENT` = 422 | spec de servicio |
| ID-12 correo sin institucional | `personalEmail === email` y sin `workEmail` = un solo contacto HOME | spec de servicio |
| ID-16 `healthFacilityConceptId` en el historial laboral | 422 fuera del padrón, 409 por el índice | spec de servicio |
| CL-43 documentos por tipo societario | UNIPERSONAL sin constitución ni poder = 201; SRL sin constitución = 422; aseguradora igual | spec de servicio |
| ID-17 modalidad desconocida | 422 | spec de servicio |

Decisiones abiertas: ver `docs/progress/DECISIONS.md` (D-BR07-1..4, D-BR08-1..3, D-BR09-1..3).
Peldaño techo: TESTED sin base; VERIFIED sólo si el Postgres efímero legion-h2-pg levanta con el esquema de `database/SQL`.
