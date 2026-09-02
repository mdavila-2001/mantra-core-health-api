# Contrato de la superficie pública — buscador V65

**P0 del plan de la red social.** Esta tabla es el contrato de las 9 lecturas sin sesión que
implementa P2. Se publica **antes** que el código para que el frontend público (J7/J8) se construya
contra fixtures con la forma definitiva y se conecte sin reescribir un tipo.

> **Estado:** contrato congelado. La primera implementación de P2 filtra en SQL; P5 la reemplaza por
> OpenSearch **sin cambiar ninguna forma de esta página**. Si algo de acá cambia, cambia acá primero.

---

## 0 · Las tres reglas que gobiernan todo lo de abajo

**1 · No hay sesión, y por tanto no hay tenant.** `@Public()` hace que
`TenantContextInterceptor` no exija contexto de tenant (ver `src/common/tenant/tenant-context.interceptor.ts:92`).
Estas rutas leen **a través de todos los tenants**. Es lo correcto para un directorio público
—nadie busca «un cardiólogo dentro de la clínica X» sin saber que X existe— pero significa que el
aislamiento por tenant **no** te protege acá. Lo único que protege es la regla 2.

**2 · Sólo sale lo que el sujeto marcó público.** Un perfil aparece si y sólo si:

```
public_profiles.visibility_concept_id  = COMM.PROFILE_VISIBILITY_PUBLIC
public_profiles.status_concept_id      = CONCEPTS.STATE_ACTIVE
```

**Un `visibility_concept_id` nulo no es público.** Es la regla inversa a la de los posts —donde el
nulo sí se lee como público— y está razonada en `community.concepts.ts`. En dos líneas: el nulo de
un post se decide dentro de la sesión; el del perfil decidiría qué se publica en internet, a través
de todos los tenants, sobre gente que nunca lo pidió. Aparecer en el directorio es opt-in.

Una publicación aparece si y sólo si:

```
social_posts.visibility_concept_id           = COMM.POST_VISIBILITY_PUBLIC
social_posts.publication_status_concept_id   = COMM.PUBLICATION_PUBLISHED
social_posts.moderation_status_concept_id    ≠ COMM.MODERATION_REMOVED / MODERATION_RESTRICTED
social_posts.published_at                    ≤ now()
```

La proyección a campos públicos se hace **en el servicio**, con una lista blanca explícita, no
serializando la entidad. P3 agrega la prueba que falla si alguien suma un campo al DTO sin pasar por
la lista blanca.

**3 · Nada revela existencia.** Un slug inexistente y un slug despublicado devuelven **el mismo 404
con el mismo cuerpo**. No hay 403 en esta superficie: un 403 confirmaría que el recurso existe.

---

## 1 · Las 9 lecturas

Base: sin prefijo de versión, igual que `/public/directory` que ya existe. Todas son `GET`, todas
`@Public()`, ninguna acepta `Authorization` (si llega, se ignora — el resultado no depende de quién
mira).

| # | Ruta | DTO de respuesta |
|---|---|---|
| 1 | `GET /public/search` | `PublicSearchPageDto` |
| 2 | `GET /public/search/practitioners` | `PublicPractitionerPageDto` |
| 3 | `GET /public/search/medications` | `PublicMedicationPageDto` |
| 4 | `GET /public/search/organizations` | `PublicOrganizationPageDto` |
| 5 | `GET /public/search/diagnostic-units` | `PublicDiagnosticUnitPageDto` |
| 6 | `GET /public/search/insurers` | `PublicInsurerPageDto` |
| 7 | `GET /public/search/pharmacies` | `PublicPharmacyPageDto` |
| 8 | `GET /p/:slug` · `/o/:slug` · `/f/:slug` · `/l/:slug` · `/s/:slug` | `PublicProfileDetailDto` |
| 9 | `GET /public/nearby` | `PublicNearbyPageDto` |
| 10 | `GET /public/posts/:postId/reactions` | `PublicPostReactionPageDto` |
| 11 | `GET /public/posts/:postId/comments` | `PublicCommentPageDto` |
| 12 | `GET /public/comments/:commentId/replies` | `PublicCommentPageDto` |

Las tres últimas se agregaron para TAREA 01 §5.1 (AC-01-9, AC-01-11, AC-01-12) y no son variantes
con menos campos de las lecturas con sesión: `GET /community/posts/:postId/reactions` devuelve
**recuentos por tipo**, no personas, y `GET /community/posts/:postId/comments` exige `@CurrentUser`.

`:postId` y `:commentId` pasan por `ParseUUIDPipe`: lo que no es un uuid da **400** antes de tocar la
base, igual que en `/public/media/:id`. Todo lo demás —no existe, es un borrador, está moderado, su
autor se despublicó, el comentario cuelga de algo que no es una publicación— da el **mismo 404**.

La 8 son cinco rutas físicas sobre un mismo servicio; el prefijo fija el tipo esperado y un slug del
tipo equivocado da 404, no una redirección (`/p/` profesional · `/o/` organización · `/f/` farmacia
· `/l/` laboratorio · `/s/` aseguradora).

---

## 2 · Parámetros de consulta

### Comunes a las siete búsquedas (1–7)

> **Lo implementado y lo previsto se distinguen en estas tablas.** Un parámetro
> marcado como previsto **hoy se ignora en silencio**: la respuesta llega sin
> acotar. Quien construya una pantalla contra él va a dibujar un filtro que no
> filtra, que es peor que no dibujarlo — la lista no cambia y la pantalla le
> dice a quien lo usó, sin decírselo, que todos los resultados cumplen su
> criterio. Verificado contra el controlador el 2026-08-18.

| Parámetro | Tipo | Por omisión | Estado | Nota |
|---|---|---|---|---|
| `q` | `string` | — | **implementado** | Texto libre. Sin acentos y sin distinguir mayúsculas: «cardiologo» encuentra «Cardiología». Máx. 120 caracteres |
| `cursor` | `string` | — | **implementado** | Cursor opaco. **No se construye en el cliente**: se copia de `nextCursor` |
| `limit` | `int` | `20` | **implementado** | Acotado a `[1, 50]`. Un valor fuera de rango se **recorta**, no da 400 |
| `city` | `string` | — | *previsto* | El controlador no lo lee. `community.public_profiles` no tiene columna de ciudad, y `city` viaja como `null` en toda respuesta: no hay dato con el que filtrar hasta que exista la fuente |

### Propios de cada vertical

| Ruta | Parámetro | Tipo | Estado | Nota |
|---|---|---|---|---|
| `/search/practitioners` | `verified` | `boolean` | **implementado** | `true` = sólo verificados. Omitido = todos, verificados primero (D7) |
| | `specialty` | `uuid` | **implementado** | `concept_id` de `VS_MEDICAL_SPECIALTY` (36 conceptos, patch v4.0.11). **No** es el nombre de la especialidad. Uno ajeno al conjunto da **422** |
| `/search/medications` | `form` | `string` | *previsto* | Forma farmacéutica |
| | `inStock` | `boolean` | *previsto* | Sólo con existencia positiva |
| `/search/organizations` | `kind` | `string` | *previsto* | Tipo de organización |
| `/search/diagnostic-units` | `study` | `string` | *previsto* | Estudio ofertado |
| `/search/insurers` | `planKind` | `string` | *previsto* | Tipo de plan |
| `/search/pharmacies` | `open` | `boolean` | *previsto* | Abiertas al momento de la consulta |

### `/search/medications` devuelve vacío, y es correcto

Un medicamento **no es un perfil**: vive en el catálogo de farmacia, y el
buscador público consulta `community.public_profiles` y nada más. El vertical
acota por `kind: 'MEDICATION'`, que no tiene concepto de sujeto en esa tabla.

Hasta el 2026-08-18 ese filtro **se perdía en silencio** y la ruta devolvía el
directorio completo de profesionales a quien buscaba un remedio. Ahora devuelve
la envoltura con `items: []` y lo deja anotado en el log del servicio, igual que
`nearby` mientras no existan las coordenadas. Los campos de
`PublicMedicationSummaryDto` quedan declarados para cuando el catálogo tenga
superficie pública; hoy no los sirve nadie.

### `/public/nearby` (9)

| Parámetro | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `lat` | `number` | sí | `[-90, 90]` |
| `lng` | `number` | sí | `[-180, 180]` |
| `radiusKm` | `number` | no | Por omisión `5`, acotado a `[1, 50]` |
| `kind` | `string` | no | `PRACTITIONER` · `ORGANIZATION` · `PHARMACY` · `DIAGNOSTIC_UNIT` |
| `limit` | `int` | no | Por omisión `20`, acotado a `[1, 50]` |

`lat`/`lng` ausentes o fuera de rango dan **400**, no un resultado vacío: es el único caso de esta
superficie donde el cliente puede estar equivocado de forma no ambigua.

---

## 3 · Formas de respuesta

**Convención de nulos.** Todo campo opcional viaja como `null` explícito, **nunca omitido** — la
regla que `core/data-access/wire.ts` documenta en el frontend. Los tipos del cliente se declaran
`| null`, no `?:`.

**Convención de fechas.** Instante ISO-8601 en UTC (`"2026-08-14T19:30:00.000Z"`).

### La envoltura de página

Las siete búsquedas y `nearby` devuelven la misma envoltura:

```ts
{
  items: T[];              // nunca null; vacío es []
  nextCursor: string|null; // null = no hay más
  totalHint: number|null;  // aproximado; null cuando no se puede estimar barato
  generatedAt: string;     // instante ISO
}
```

`totalHint` es una **pista**, no un total. No lo uses para paginación ni para «N resultados» sin el
matiz de «aproximadamente» — con OpenSearch (P5) deja de ser exacto por encima de 10 000.

### `PublicSearchResultDto` — el ítem de la búsqueda unificada (1)

```ts
{
  kind: 'PRACTITIONER'|'ORGANIZATION'|'PHARMACY'|'DIAGNOSTIC_UNIT'|'INSURER'|'MEDICATION';
  slug: string;            // el que va en /p/:slug etc.
  displayName: string;
  headline: string|null;
  city: string|null;
  avatarUrl: string|null;  // URL absoluta ya resuelta, o null. Nunca un fileId
  verified: boolean;
  ratingAverage: number|null;  // 1..5, una decimal
  ratingCount: number;         // 0 cuando no hay reviews
}
```

`avatarUrl` llega **resuelto a URL**, no como `avatarFileId`. El cliente público no tiene sesión y
por tanto no puede pedir una URL firmada: resolverla es responsabilidad del servidor.

### Los ítems de cada vertical

Cada uno es `PublicSearchResultDto` **más** sus campos propios. Nada se quita.

| DTO | Agrega |
|---|---|
| `PublicPractitionerSummaryDto` | `specialties: string[]` · `acceptsReviews: boolean` |
| `PublicMedicationSummaryDto` | `form: string\|null` · `strength: string\|null` · `offersCount: number` · `priceFrom: number\|null` · `currency: string\|null` |
| `PublicOrganizationSummaryDto` | `kind: string\|null` · `branchCount: number` |
| `PublicDiagnosticUnitSummaryDto` | `studies: string[]` · `accredited: boolean` |
| `PublicInsurerSummaryDto` | `planKinds: string[]` |
| `PublicPharmacySummaryDto` | `openNow: boolean\|null` · `address: string\|null` |

`priceFrom` es el mínimo de las ofertas visibles y viaja junto a `currency`; **nunca** un número
suelto — un precio sin moneda en un país con dos monedas en circulación es un defecto, no un ahorro.

### `PublicProfileDetailDto` — el detalle por slug (8)

```ts
{
  kind: 'PRACTITIONER'|'ORGANIZATION'|'PHARMACY'|'DIAGNOSTIC_UNIT'|'INSURER';
  slug: string;
  displayName: string;
  headline: string|null;
  biography: string|null;
  avatarUrl: string|null;
  coverUrl: string|null;
  verified: boolean;
  city: string|null;
  address: string|null;
  location: { lat: number; lng: number }|null;
  specialties: string[];
  ratingAverage: number|null;
  ratingCount: number;
  acceptsReviews: boolean;
  posts: PublicPostSummaryDto[];   // sólo las publicaciones PUBLIC, máx. 20
  updatedAt: string;               // alimenta el ETag y el <lastmod> del sitemap
}
```

```ts
// PublicPostSummaryDto
{
  id: string;
  bodyText: string;
  publishedAt: string;
  mediaUrls: string[];      // vacío, nunca null
  reactionCount: number;
  commentCount: number;
}
```

**Lo que este DTO no tiene, y no va a tener:** `tenantId`, `targetId`, ningún `*ConceptId`, ningún
`*FileId`, `createdByUserId`, `updatedByUserId`, `rowVersion`. Si alguno aparece, la prueba de
proyección de P3 falla — que es exactamente para lo que existe.

### `PublicNearbyResultDto` (9)

`PublicSearchResultDto` más:

```ts
{
  distanceKm: number;                     // línea recta, una decimal
  location: { lat: number; lng: number };
}
```

`distanceKm` es **distancia en línea recta**, no de recorrido. La ficha V65-12 exige ese rótulo
literal en pantalla; el nombre del campo lo dice para que nadie lo confunda al conectarlo.

### `PublicPostReactionDto` (10) y `PublicCommentDto` (11, 12)

```ts
// 10 · quién reaccionó
{
  slug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  kind: PublicResultKind;
  reactionType: 'LIKE' | 'LOVE' | 'INSIGHTFUL' | 'CELEBRATE' | 'SUPPORT' | null;
}

// 11 y 12 · el hilo y sus respuestas
{
  id: string;
  bodyText: string;
  createdAt: string;                 // ISO-8601 en UTC
  replyCount: number;                // 0, nunca null
  author: {                          // los mismos 5 campos de arriba
    slug, displayName, headline, avatarUrl, kind
  };
}
```

Los cinco campos de la persona son **exactamente** los que la lectura 1 (`GET /public/posts`) ya
sirve para el autor de una publicación (`authorSlug`, `authorDisplayName`, `authorHeadline`,
`authorAvatarUrl`, `authorKind`). Reaccionar o comentar no publica de nadie nada que publicar no
publicara ya: ni `actor_profile_id`, ni `author_profile_id`, ni `user_id`, ni correo, ni teléfono, ni
`reaction_type_concept_id` — el tipo de reacción viaja por su **código**.

**Sólo salen perfiles públicos y activos.** Quien reaccionó o comentó sin vitrina publicada no
aparece, ni siquiera anonimizado ni contado aparte; lo resuelve el `JOIN` de la consulta, no un
filtro en memoria. La consecuencia visible es que el `commentCount` de la lectura 1 puede ser mayor
que la cantidad de comentarios servidos por la 11.

Las respuestas **no** vienen anidadas dentro del hilo: cada comentario trae su `replyCount` y las
suyas se piden por la lectura 12 cuando alguien las abre. Es lo que evita que un hilo de doscientas
respuestas llegue entero dentro de una tarjeta.

---

## 4 · Cabeceras, cachés y errores

| | |
|---|---|
| `ETag` | En las 9. Débil, derivado de `updatedAt` del recurso o del `generatedAt` de la página |
| `Cache-Control` | `public, max-age=60, stale-while-revalidate=300` en búsquedas; `max-age=300` en perfiles |
| `304` | Si el `If-None-Match` coincide. El cuerpo va vacío |
| `429` | Rate limit por IP (P3). Incluye `Retry-After` en segundos |

**Códigos.** `200` · `304` · `400` en `nearby` sin coordenadas válidas y en un `:postId`/`:commentId`
que no es un uuid · `404` en un slug, una publicación o un comentario que no existe **o** que no es
público · `422` en `/search/practitioners?specialty=` con un uuid que no pertenece a
`VS_MEDICAL_SPECIALTY` (o cuando ese catálogo no está sembrado) · `429` · `503` si el índice no está
disponible. **No hay `401` ni `403` en esta superficie.**

Un `404` devuelve siempre el mismo cuerpo, sin distinguir el motivo. El cuerpo lo arma el filtro de
excepciones del proyecto, no esta superficie, así que tiene la forma de todos los errores de la API
—verificado contra la API viva el 2026-08-17—:

```json
{
  "code": "NOT_FOUND",
  "message": "No encontrado",
  "correlationId": "6",
  "details": { "slug": "no-existe" },
  "timestamp": "2026-08-17T21:03:50.781Z",
  "path": "/p/no-existe"
}
```

`details.slug` **no revela existencia**: es el slug que mandó quien pregunta, devuelto tal cual. Un
slug inexistente y uno despublicado producen respuestas idénticas salvo por ese eco y el
`correlationId`, y eso es lo que hay que preservar. Lo comprueba `seed:e2e:verify`, que pide los dos
y compara los mensajes.

---

## 5 · Cómo construye el frontend contra esto hoy

J7 y J8 no esperan a P2. Se construyen contra fixtures con **estas formas exactas** y se conectan
cambiando el origen, no los tipos. Lo que J8 necesita saber de entrada:

- `avatarUrl` y `coverUrl` ya vienen resueltos — no hay que firmar nada en el cliente.
- `updatedAt` del perfil es lo que va en el `<lastmod>` del sitemap y en `og:updated_time`.
- `ratingCount: 0` con `ratingAverage: null` es el estado normal de un catálogo a medio poblar: la
  pantalla tiene que verse bien así, no como un error.
- El cursor es opaco. Guardarlo, no parsearlo.
