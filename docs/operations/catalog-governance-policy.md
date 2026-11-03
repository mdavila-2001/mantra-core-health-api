# Política operativa del catálogo

## Frescura de la sonda de catálogo

El umbral de frescura usa dos intervalos de escaneo más el lease de recuperación
(35 minutos con los intervalos actuales). `CATALOG_SCAN_STALE_AFTER_SECONDS` permite
configurarlo entre un intervalo más el lease y un día. Un valor inválido detiene
el arranque. El umbral efectivo viaja en cada resultado de la sonda de ajuste.

## Retención y linaje

Los plazos publicados por el catálogo conservan la fuente del modelo. Una tabla sin
plazo o base legal verificable mantiene ese dato como desconocido. La plataforma no
completa plazos clínicos por analogía ni elimina datos clínicos por esta sonda.
Las corridas técnicas de catalog_fit_runs conservan su política operativa propia.

El linaje se informa como no oficial hasta existir respaldo aprobado. Las
contradicciones entre reglas de mutabilidad se exponen como hallazgos; una etiqueta
APPEND_ONLY no se usa como prueba de inmutabilidad si existen escrituras incompatibles.
