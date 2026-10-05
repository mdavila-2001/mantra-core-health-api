# Reporte — Gates de CI de `dev`

## Completado

| Entregable | Cambio | Verificación | Resultado |
|---|---|---|---|
| Lint de terminología | Se aplicó el formato canónico de Prettier a la llamada de `searchConcepts` | `corepack yarn lint --max-warnings=0` | Verde |
| Autorización de reclamos | `ClaimsReadController` volvió a exigir exactamente `BILLING_OPERATOR` o `SECURITY_ADMIN` | Spec dirigido de controladores de insurance | 21/21 |
| Cobertura del comportamiento reciente | Se agregaron casos para grafo del glosario, directorio de aseguradora, perfiles y solicitudes de dependientes | Suite dirigida | 311/311 |
| Regresión completa | Se ejecutó Jest con cobertura y dos workers, igual que CI | `NODE_OPTIONS=--max-old-space-size=6144 corepack yarn test:cov` | 807 suites aprobadas; 9.990 pruebas aprobadas; ramas 69,00 % |

## A medias

Ninguna tarea del alcance original quedó a medias.

## Pendiente

- El objetivo posterior solicitado de cobertura global 100 % se ejecutará en una rama separada. La base actual tiene 31.537 ramas, 51.920 líneas y 14.037 funciones; faltan cubrir 9.776 ramas, 12.645 líneas y 5.539 funciones.
- Observar los checks del PR contra `dev` y corregir cualquier diferencia del entorno remoto.

## Evidencia

- `evidencia/lint-baseline.txt`: cuatro errores Prettier reproducidos en la base.
- `evidencia/coverage-summary.txt`: resumen de la corrida global verde.
- Specs dirigidos: 8 suites, 311 pruebas aprobadas.
- Regresión global: 807 suites aprobadas, una suite preexistente omitida; 9.990 pruebas aprobadas, una prueba preexistente omitida.

## No cubierto

- No se cambió el umbral de Jest, `collectCoverageFrom`, exclusiones ni configuración de cobertura.
- No se modificaron migraciones, esquema, contratos de datos ni rutas públicas.
- La cobertura global 100 % queda fuera de este PR para mantener el arreglo de CI revisable.

## Desvíos

- `test:cov --runInBand` agotó memoria con 4 GB y 6 GB porque un único worker acumuló todos los módulos. La verificación final usó el comando estándar con dos workers configurados, que coincide con CI y terminó correctamente.
- La primera ampliación de pruebas alcanzó 68,98 %, la segunda 68,99 % y la tercera 69,00 %. No se relajó el umbral; se cubrieron decisiones adicionales hasta superarlo.

## Riesgos residuales

- `concepts.service.ts` y numerosos módulos heredados siguen por debajo de 100 % de cobertura. El riesgo se aborda en el trabajo separado solicitado después de este cierre.
- Jest emite advertencias preexistentes por imports JSON sin atributo; no afectaron la ejecución y este PR no cambia esos imports.

## Decisiones y ambigüedades

- El historial mostró que `ClaimsReadController` nació con `BILLING_OPERATOR` y `SECURITY_ADMIN`; la ampliación posterior agregó cuatro roles sin prueba ni cambio equivalente en el contrato. `USER` es global y habría permitido que cualquier miembro activo del tenant leyera reclamos con datos sensibles. Se restauró la política original.
- Los operadores de aseguradora conservan la ruta específica `/insurance/received-claims`, protegida por contexto y alcance de aseguradora.
- La solicitud posterior de cobertura global 100 % se separa de este arreglo porque amplía el trabajo a miles de decisiones heredadas ajenas al rojo de CI.
