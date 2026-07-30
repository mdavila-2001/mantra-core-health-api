# src / modules / identity assurance

Agrupa los componentes relacionados con **identity assurance** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`controllers/`](./controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](./entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](./repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](./services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `identity_assurance.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `identity_assurance.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
