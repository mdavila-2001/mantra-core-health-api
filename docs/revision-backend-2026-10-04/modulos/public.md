# Revisión del módulo `public` — ALOVIDA

## Alcance y resultado

Se revisaron las dos rutas públicas de catálogo, sus DTO, servicio, SQL crudo y
las pruebas HTTP/unitarias. No se confirmó un hallazgo de seguridad o contrato
en esta unidad: la exposición sin sesión está declarada mediante `@Public()`, se
limita a 60 solicitudes por minuto y la proyección SQL enumera columnas públicas
en vez de propagar filas completas.

- `GET /public/profiles/o/:slug/services`
- `GET /public/profiles/f/:slug/products`

El repositorio resuelve sólo perfiles activos y visibles
([public-catalog.repository.ts](../../../src/modules/public/repositories/public-catalog.repository.ts#L70-L93)),
oculta el tipo real tras el mismo 404
([public-catalog.service.ts](../../../src/modules/public/services/public-catalog.service.ts#L138-L150))
y emplea parámetros para slug, tenant y cursor. Las lecturas tienen keyset y un
tope HTTP de 50 elementos ([public-catalog.dto.ts](../../../src/modules/public/dto/public-catalog.dto.ts#L10-L46)).

## Pruebas ejecutadas

```text
corepack yarn test src/modules/public --runInBand --silent
4 suites, 31 pruebas aprobadas
```

Las pruebas cubren perfil inexistente/de tipo distinto, cursor corrupto, límite,
proyección pública, precio como texto y producto sin stock. La SQL se ejecuta
contra mocks en la mayoría de los casos; queda pendiente una integración con
PostgreSQL y RLS que compruebe que no puede aparecer una práctica de otro tenant.

## Matriz de regresión que se conserva

| Ruta | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Servicios públicos | Perfil visible con catálogo | `limit=50` y segunda página por cursor | `limit=51` o cursor inválido | `400/VALIDATION_ERROR/PUBLIC_CATALOG_INVALID_CURSOR` |
| Productos públicos | Farmacia visible, verificada y con lista pública | Producto sin stock y precio `null` | Parámetro no declarado | `404/RESOURCE_NOT_FOUND/PUBLIC_CATALOG_PROFILE_NOT_FOUND` para slug oculto, ajeno o de otro tipo |

## Riesgo residual y acción futura

La semántica pública del stock es un booleano, por lo que la proyección no revela
cantidad exacta. Antes de cambiar esa respuesta o sumar datos de receta,
profesional o ubicación, extender la lista explícita de columnas publicables y
la prueba que verifica que no salen campos internos.
