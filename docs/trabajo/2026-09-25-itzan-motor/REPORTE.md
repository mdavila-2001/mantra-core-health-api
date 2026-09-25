# Reporte — Motor de la carga masiva de terminología

> **AVANCE: 2 / 110 — 1,8 %.**

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base: `dev`
- Corte: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315`
- Peldaño de evidencia alcanzado (regla 30): **`WRITTEN`** — el contrato de fila está escrito; todavía no
  hay compilación ni tests propios corridos.

> Reporte en curso: el trabajo sigue abierto y este archivo se actualiza al cerrar cada microtarea.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Checkout limpio del corte y rama propia, sin tocar el checkout de trabajo | `git rev-parse HEAD` | PASS · `343795cc2d08745692f491c50e81427215043315` |
| H1.S1.M2 | Dependencias instaladas en ese checkout | instalación del gestor de paquetes | PASS · exit 0 · `evidencia/antes/install.txt` |

## A medias

### H1.S1.M3 — Baseline de lint, tipos y compilación
- Qué anda: el comando arrancó sobre el corte limpio y está produciendo su salida.
- Qué no anda: nada; todavía no terminó.
- Qué falta exactamente: que termine y queden los tres códigos de salida en el archivo de evidencia.
- Dónde quedó: `evidencia/antes/baseline.txt`, en curso.

### H2.S2.M2 — Contrato de fila
- Qué anda: `import/row-contract.ts`, su spec y el barrel están escritos con los tipos del contrato
  compartido, literales.
- Qué no anda: nada.
- Qué falta exactamente: comprobación de tipos en verde, spec en verde, commit y publicación de la rama.
- Dónde quedó: `src/modules/terminology/import/{row-contract.ts, row-contract.spec.ts, index.ts}`, sin
  commitear.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M4, H1.S1.M5 | TODO | Que termine el baseline |
| H1.S2 completo | TODO | Base viva y API arrancada para ejercitar el endpoint de hoy |
| H2.S1, H2.S3, H2.S4, H2.S5 | TODO | Orden del plan |
| H3, H4, H5, H6, H7 | TODO | Orden del plan |

## Evidencia

```text
$ git rev-parse HEAD
343795cc2d08745692f491c50e81427215043315
```

Índice de `evidencia/`:

| Archivo | Qué guarda |
|---|---|
| `antes/install.txt` | Instalación de dependencias sobre el corte, con su código de salida |
| `antes/baseline.txt` | Lint, comprobación de tipos y compilación del corte, antes de tocar nada |

## No cubierto

Todo, salvo lo listado en «Completado». En particular: no se ejercitó todavía el endpoint contra la API
viva, así que ninguna afirmación de este reporte describe comportamiento observado.

## Desvíos del plan

Ninguno todavía. Los dos cambios de contrato previstos están en «Decisiones y ambigüedades».

## Riesgos residuales

| Riesgo | Impacto |
|---|---|
| El log del servicio esparce hoy la respuesta entera; al sumarle la vista previa, filas completas llegarían al registro | Alto: contenido de datos en los logs. Mitigado en H3.S2.M9 |
| Sin índice único por versión y código, dos subidas simultáneas del mismo archivo podrían duplicar | Medio: se prueba en H4.S1.M6; el esquema no se toca |

## Decisiones y ambigüedades

| ID | Qué se decidió | Sobre qué evidencia | A quién confirmar |
|---|---|---|---|
| Q-2 | **Todo o nada**, cambiando el comportamiento actual, que sí inserta las filas buenas de un archivo con errores. Registrado en [decision-todo-o-nada.md](./decision-todo-o-nada.md) | `concept-file-import.service.ts:130-160` y su propio spec | Quien integra los carriles |
| Q-5 (nueva) | El archivo vacío pasa de 412 a 422 con código propio, por coherencia con las otras tres condiciones del archivo | `concept-file-import.service.ts:123-127` | Quien integra los carriles |
| Q-I1 | El dry-run responde 200 y la importación real 201 | El repo ya usa respuesta con control explícito del estado en tres controladores | Resuelta, sin desviación |
| Q-I4 (nueva) | La detección de formato se implementa en su propio archivo y se publica desde el barrel; el contrato de fila expone el **tipo** de esa firma, no una función sin implementación | El contrato compartido declara la función sin cuerpo, lo que en ejecución no serviría a quien la importe | Quien integra los carriles |
| Q-7 | Un código que ya existe en la versión se omite, nunca se actualiza | Es lo que el servicio ya hace | Confirmada contra el código |
| Q-I2 | Sin índice único, la carrera entre dos subidas se mide antes de afirmar nada | Pendiente de H4.S1.M6 | Quien lleva el modelo |
