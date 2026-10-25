# Centros médicos — búsqueda por procedimientos

Busca centros médicos (sedes de una práctica) por los procedimientos del nomenclador
boliviano (`VS_BO_MEDICAL_PROCEDURE`) que ofrecen con precio publicado. Es la mitad de
lectura del flujo «centros médicos»: el catálogo de la sede, las afiliaciones y el modo de
ejecutor de la orden viven en `practice` y `clinical`.

## Rutas

| Método y ruta                               | Acceso                                      | Qué hace                                                                                                     |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GET /medical-centers/search`               | pública (`@TenantAgnostic()`, sin `@Roles`) | Sedes que ofrecen los procedimientos de `procedureConceptIds`, con su cobertura                              |
| `GET /medical-centers/search/for-my-orders` | `PATIENT`                                   | Lo mismo, con los procedimientos tomados de las órdenes del titular (`serviceRequestIds`); orden ajena → 404 |

## Reglas

- Solo aparecen sedes activas con un servicio activo y un ítem de catálogo activo con
  precio: sin precio publicado no hay oferta visible.
- `includePartial` es `false` por defecto: solo los centros que ofrecen todo lo pedido.
- **El orden lo decide la API y es igual para todos:** completos primero, después la
  distancia en línea recta (sin distancia, al final), después el precio total y por último el
  nombre. La página se corta después de ordenar.
- `practitionerWorksHere` y `suggestedByPractitioner` solo existen en `for-my-orders` y
  **no** cambian qué sedes aparecen ni en qué orden: el comparador
  (`services/medical-center-ranking.ts`) no recibe esos datos.
- `overMargin` es siempre `null`: el margen del aviso de sobreprecio no está fijado.
- `totalPrice` suma lo que la sede cobra por lo pedido; con más de una moneda es `null`,
  porque sumar monedas distintas pondría un número falso.

## Estructura

| Carpeta        | Contenido                                                                              |
| -------------- | -------------------------------------------------------------------------------------- |
| `controllers/` | `MedicalCentersController`                                                             |
| `services/`    | Búsqueda por cobertura, búsqueda para las órdenes de un paciente y comparador de orden |
| `ports/`       | Lo que el módulo necesita de las demás tablas, como clases abstractas inyectables      |
| `dto/`         | Filtros de consulta y respuesta (`MedicalCenterPageDto`)                               |
