# Matriz del alta de organización por API — corrida 2D0AEC

Resultado: **32 PASS / 0 FAIL** de 32.

| Escenario | Caso | Esperado | Real | OK | Detalle |
|---|---|---|---|---|---|
| válido | aseguradora SA completa (5 PDF + poder + 3 gerencias) | 201 | 201 | PASS |  |
| válido | quedaron 6 documentos de afiliación (5 + poder) en la base | 6 | 6 | PASS |  |
| válido | todos nacen con estado PENDIENTE | PENDIENTE | PENDIENTE | PASS |  |
| válido | el dueño inicia sesión | 200 | 200 | PASS |  |
| válido | UNIPERSONAL sin escritura de constitución ni poder | 201 | 201 | PASS |  |
| válido | UNIPERSONAL: 4 documentos en la base | 4 | 4 | PASS |  |
| límite | código de organización de 3 caracteres (mínimo) | 201 | 201 | PASS |  |
| límite | código de organización de 100 caracteres (máximo) | 201 | 201 | PASS |  |
| límite | código de organización de 2 caracteres (bajo el mínimo) | 400 | 400 | PASS | Error de validación |
| límite | código de organización de 101 caracteres (sobre el máximo) | 400 | 400 | PASS | Error de validación |
| límite | razón social de 300 caracteres | 201 | 201 | PASS |  |
| límite | razón social de 301 caracteres | 400 | 400 | PASS | Error de validación |
| límite | contraseña de 8 caracteres | 201 | 201 | PASS |  |
| límite | contraseña de 7 caracteres | 400 | 400 | PASS | Error de validación |
| límite | PDF de exactamente 10485760 bytes | 201 | 201 | PASS |  |
| límite | PDF de 1 byte sobre el máximo | 413|422 | 413 | PASS |  |
| error | preparación: la primera alta con ese código | 201 | 201 | PASS |  |
| error | código de organización repetido | 409 | 409 | PASS |  |
| error | correo del dueño repetido | 409 | 409 | PASS |  |
| error | SA sin escritura de constitución | 422 | 422 | PASS |  |
| error | SA sin poder del representante | 422 | 422 | PASS |  |
| error | el mismo archivo en dos documentos | 422 | 422 | PASS |  |
| error | archivo ya vinculado a otra organización | 422 | 422 | PASS |  |
| error | fileId que no existe (en la vía anónima el contrato es 422, attachable-file.service.ts:213) | 422 | 422 | PASS |  |
| error | aseguradora (PAYER) sin el bloque payer | 422 | 422 | PASS |  |
| error | tenantType inexistente | 400 | 400 | PASS |  |
| error | correo del dueño mal formado | 400 | 400 | PASS |  |
| error | cuerpo vacío | 400 | 400 | PASS |  |
| error | archivo de texto que dice ser PDF | 422 | 422 | PASS |  |
| error | archivo vacío | 400|422 | 422 | PASS |  |
| error | imagen subida como documento | 422 | 422 | PASS |  |
| transversal | ninguna respuesta 5xx en toda la matriz | 0 | 0 | PASS |  |
