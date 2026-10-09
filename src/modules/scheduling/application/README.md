# application/

Casos de uso de la agenda. Cada área tiene una **fachada** (`scheduling-*.service.ts`) que conserva la
API pública histórica y delega en clases `use-cases/*.use-case.ts` (una operación = una clase = una
transacción), apoyadas en colaboradores de `support/`.

| Carpeta | Contenido |
| --- | --- |
| `bookings/` | reservas: 18 casos de uso + 9 colaboradores |
| `catalog/` | recursos, políticas, plantillas, cupos y excepciones: 16 casos de uso + 4 colaboradores |
| `waitlist/` `confirmation/` `delay/` `notices/` `agenda/` `professional-time/` `affiliation/` `walk-in/` `service-offerings/` | servicios del área |
| `ports/` | contratos hacia otros contextos (ver `ports/README.md`) |

Reglas: no se importa `infrastructure/` (salvo los repositorios propios, excepción declarada en
`src/architecture/module-layering.spec.ts`) ni se toca otro módulo sin pasar por un puerto.
