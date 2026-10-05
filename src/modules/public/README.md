# Public catalog module

Expone sin sesión los catálogos de servicios de organizaciones y de productos de
farmacias que tienen una ficha pública activa. Las consultas usan paginación por
cursor, límite de 50 y rate limit de 60 solicitudes por minuto.

## Verificación

```bash
corepack yarn test src/modules/public --runInBand --silent
```

La auditoría de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/public.md`](../../../docs/revision-backend-2026-10-04/modulos/public.md).
