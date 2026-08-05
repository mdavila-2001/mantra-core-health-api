# database / salud db

Agrupa los componentes relacionados con **salud db** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `apply_redesa_all.py` | Implementación o recurso de soporte de esta carpeta. |
| `apply.ps1` | Implementación o recurso de soporte de esta carpeta. |
| `fix_vault_fk.py` | Implementación o recurso de soporte de esta carpeta. |
| `gen_apply.py` | Implementación o recurso de soporte de esta carpeta. |
| `gen_ddl.py` | Implementación o recurso de soporte de esta carpeta. |
| `gen_entities.py` | Implementación o recurso de soporte de esta carpeta. |
| `gen_integrity.py` | Implementación o recurso de soporte de esta carpeta. |
| `gen_nosql.py` | Implementación o recurso de soporte de esta carpeta. |
| `load_seeds.py` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
