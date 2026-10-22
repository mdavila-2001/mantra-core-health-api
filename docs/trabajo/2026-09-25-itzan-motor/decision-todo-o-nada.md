# Decisión — el import por archivo pasa a ser todo o nada

- Fecha: 2026-09-25 · Trabajo: [PLAN.md](./PLAN.md) · Afecta: `POST /terminology/versions/{versionId}/import-file`
- Estado: **aplicada**, con aviso pendiente a quien consume el endpoint.

## Qué cambia

| Caso | Antes | Ahora |
|---|---|---|
| Archivo con filas buenas y filas malas | Se insertaban las buenas, se informaban las malas y quedaba un lote registrado | No se inserta nada: `aborted: true`, `inserted: 0`, `errors: N`, sin lote |
| Archivo de 0 bytes o sólo con encabezado | 412, con el mensaje «El archivo llegó vacío» | 422 con el código `IMPORT_EMPTY_FILE` |

## Por qué

El contrato compartido de esta carga lo pide así, y la razón es de producto: quien sube un catálogo
necesita saber que el archivo entró **entero** o que no entró. Con el comportamiento anterior, un
archivo de cincuenta mil filas con tres rotas dejaba la versión a medio llenar, y la única forma de
saber cuáles faltaban era comparar a mano. Peor todavía al reintentar: las filas que sí habían
entrado pasaban a contarse como omitidas, así que el segundo informe ya no se parecía al primero y
nadie podía deducir el estado real.

Con todo o nada, el ciclo es el que espera quien carga: se valida sin guardar, se corrigen las filas
señaladas y se vuelve a subir el archivo completo.

El caso del archivo vacío se mueve a 422 por coherencia: 412 estaba reservado a las precondiciones de
la versión (que exista y esté en borrador), y un archivo sin contenido es un problema del archivo,
igual que un formato no admitido o un perfil desconocido. Los tres comparten familia de código.

## Evidencia del comportamiento anterior

- `concept-file-import.service.ts:130-160` en el corte `343795cc`: `leer()` devuelve conceptos y
  errores por separado, y `escribir()` recibe los conceptos igual, haya o no errores.
- Su propio spec lo fijaba como comportamiento esperado, en el caso «una línea rota no arrastra a las
  buenas».
- `concept-file-import.service.ts:123-127`: el archivo vacío lanzaba la excepción de precondición.

## Qué se hizo con el test que lo fijaba

No se borró ni se debilitó. El caso se **reescribió** para describir el comportamiento nuevo, con su
nombre cambiado, porque lo que cambió es el requisito y no la calidad del test. El resto de la
caracterización quedó intacta.

## Compatibilidad

Ningún campo de la respuesta cambia de nombre ni de tipo. `batchId` pasa a admitir nulo, que es
aditivo para quien ya lo leía como texto y es lo que el contrato declara para el dry-run y para el
archivo abortado.

## A quién hay que avisar

A quien integra los carriles de esta carga y a quien construye la pantalla que consume el endpoint:
los dos leen el contrato compartido, que ya describe el comportamiento nuevo, pero el cambio respecto
de lo que la API hacía hasta hoy no estaba anotado en ningún lado. Queda registrado como la
ambigüedad Q-2 del plan.
