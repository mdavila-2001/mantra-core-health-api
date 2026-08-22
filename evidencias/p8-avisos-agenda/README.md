# Evidencias · Carril P8 «Avisos de agenda» (API)

| Archivo | Qué prueba |
|---|---|
| `recorrido.json` | Recorrido funcional completo contra la API viva (`localhost:3010`) y Postgres del compose: 23/23 pasos. B se anota en la lista → A cancela con motivo → el worker promueve → el profesional se demora → el worker despacha recordatorios. Incluye ids reales para reproducir las capturas. |
| `bandeja-in-app.txt` | Volcado de `messaging.in_app_notifications` tras ese recorrido: las cuatro categorías de aviso, en `INAPP_UNREAD` y con su `route` de destino navegable. Es la prueba de que los avisos existen en la base, no en un log. |
| `reverificacion-18-08.png` | Corrida de control del 18/08 sobre la rama ya entregada: suites re-ejecutadas, verificadores del front, comprobaciones de DoD y lo que queda pendiente (publicar ramas y abrir PR). |

Capturas del front: `mantra-core-health/evidencias/p8-avisos-agenda/`.
