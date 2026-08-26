import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Formas de la superficie pública del buscador (V65). El contrato está
 * congelado en `openapi/CONTRATO-PUBLICO.md` y **estas clases son su única
 * implementación**: el frontend público se construyó contra esa página, así que
 * un campo que cambie de nombre acá le rompe una pantalla allá.
 *
 * ## La convención de nulos, y por qué importa
 *
 * Todo opcional viaja como `null` explícito, **nunca omitido**. El cliente
 * Angular declara estos campos `| null`, no `?:`; la diferencia no es
 * cosmética, y ya costó una vez: `new Date(null)` es 1970, no `Invalid Date`, y
 * `campo !== undefined` es `true` cuando el campo vale `null`.
 *
 * ## Lo que estas clases no tienen, y no pueden tener
 *
 * Ningún `tenantId`, `targetId`, `*ConceptId`, `*FileId`, `createdByUserId` ni
 * `rowVersion`. La proyección se arma campo por campo en el servicio, con lista
 * blanca, y `community-public.service.spec.ts` falla si aparece una clave que
 * no esté en esa lista. Es la defensa de P3 contra la fuga más cara del módulo:
 * un `avatarFileId` servido a un anónimo es un identificador interno regalado.
 */

/** Tipos de sujeto que el buscador público sabe devolver. */
export type PublicResultKind =
  | 'PRACTITIONER'
  | 'ORGANIZATION'
  | 'PHARMACY'
  | 'DIAGNOSTIC_UNIT'
  | 'INSURER'
  | 'MEDICATION';

/** Punto geográfico servido públicamente. */
export class PublicLocationDto {
  @ApiProperty({ description: 'Latitud en grados decimales' })
  lat!: number;

  @ApiProperty({ description: 'Longitud en grados decimales' })
  lng!: number;
}

/**
 * Un resultado del buscador unificado.
 *
 * `avatarUrl` llega **resuelto a URL absoluta**, no como identificador de
 * archivo: el cliente público no tiene sesión y por tanto no puede pedir una
 * URL firmada. Resolverla es del servidor.
 */
/**
 * El sello, en la forma única que sirven todas las superficies.
 *
 * Existe porque `verified` como booleano no puede decir «Verificación
 * vencida»: un `false` mezcla al que nunca se verificó con al que se le venció
 * la matrícula, y son dos cosas muy distintas para quien elige un médico.
 * Buscador, ficha pública, Guía y selector de turnos leen este objeto, no
 * cuatro interpretaciones del booleano.
 */
export class PublicVerifiedBadgeDto {
  @ApiProperty({
    enum: ['VERIFIED', 'EXPIRED', 'NONE'],
    description:
      '`VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció',
  })
  status!: 'VERIFIED' | 'EXPIRED' | 'NONE';

  @ApiProperty({ nullable: true, description: 'Qué se verificó' })
  badgeTypeConceptId!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Cómo se verificó (autoridad externa, alta manual auditada)',
  })
  verificationMethodConceptId!: string | null;

  @ApiProperty({ nullable: true, description: 'Desde cuándo vale, ISO' })
  verifiedAt!: string | null;

  @ApiProperty({ nullable: true, description: 'Hasta cuándo vale, ISO' })
  validUntil!: string | null;
}

export class PublicSearchResultDto {
  @ApiProperty({ description: 'Tipo de sujeto' })
  kind!: PublicResultKind;

  @ApiProperty({ description: 'Slug estable; el que va en /p/:slug' })
  slug!: string;

  @ApiProperty({ description: 'Nombre visible' })
  displayName!: string;

  @ApiProperty({ nullable: true, description: 'Titular corto' })
  headline!: string | null;

  @ApiProperty({ nullable: true, description: 'Ciudad' })
  city!: string | null;

  @ApiProperty({ nullable: true, description: 'URL absoluta del avatar' })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'Si el prestador está verificado' })
  verified!: boolean;

  @ApiProperty({ nullable: true, description: 'Promedio 1..5, una decimal' })
  ratingAverage!: number | null;

  @ApiProperty({ description: 'Cantidad de reseñas; 0 cuando no hay' })
  ratingCount!: number;

  @ApiProperty({
    type: PublicVerifiedBadgeDto,
    description:
      'El sello con su procedencia. `verified` es su resumen booleano y se ' +
      'mantiene por compatibilidad: `verified === (verifiedBadge.status === "VERIFIED")`.',
  })
  verifiedBadge!: PublicVerifiedBadgeDto;

  @ApiProperty({
    description:
      'Si el profesional tiene agenda publicada. El CTA «Pedir turno» sólo ' +
      'se muestra cuando es verdad (PAC-CITA-001).',
  })
  hasPublishedAgenda!: boolean;

  @ApiProperty({
    nullable: true,
    description:
      'Primer día con hueco disponible (YYYY-MM-DD), truncado a día a ' +
      'propósito: la hora exacta cambia entre que se pinta y se toca.',
  })
  nextAvailableDate!: string | null;
}

/** Profesional de la salud en el directorio público. */
export class PublicPractitionerSummaryDto extends PublicSearchResultDto {
  @ApiProperty({ type: [String], description: 'Especialidades declaradas' })
  specialties!: string[];

  @ApiProperty({ description: 'Si acepta reseñas de atención' })
  acceptsReviews!: boolean;
}

/**
 * Medicamento ofertado.
 *
 * `priceFrom` viaja **siempre junto a `currency`** y nunca suelto: un precio
 * sin moneda en un país con dos monedas en circulación es un defecto, no un
 * ahorro de bytes.
 */
export class PublicMedicationSummaryDto extends PublicSearchResultDto {
  @ApiProperty({ nullable: true, description: 'Forma farmacéutica' })
  form!: string | null;

  @ApiProperty({ nullable: true, description: 'Concentración' })
  strength!: string | null;

  @ApiProperty({ description: 'Cuántas farmacias lo ofertan' })
  offersCount!: number;

  @ApiProperty({ nullable: true, description: 'Precio mínimo visible' })
  priceFrom!: number | null;

  @ApiProperty({ nullable: true, description: 'Moneda de `priceFrom`' })
  currency!: string | null;
}

/**
 * Organización de salud (hospital, clínica, centro).
 *
 * El campo se llama `organizationKind` y no `kind` porque `kind` ya identifica
 * el tipo de resultado en la clase base. Dos significados bajo un mismo nombre
 * en el mismo objeto es un malentendido esperando a ocurrir.
 */
export class PublicOrganizationSummaryDto extends PublicSearchResultDto {
  @ApiProperty({ nullable: true, description: 'Tipo de organización' })
  organizationKind!: string | null;

  @ApiProperty({ description: 'Sucursales publicadas' })
  branchCount!: number;
}

/** Unidad de diagnóstico (laboratorio, centro de imágenes). */
export class PublicDiagnosticUnitSummaryDto extends PublicSearchResultDto {
  @ApiProperty({ type: [String], description: 'Estudios ofertados' })
  studies!: string[];

  @ApiProperty({ description: 'Si tiene acreditación vigente' })
  accredited!: boolean;
}

/** Aseguradora. */
export class PublicInsurerSummaryDto extends PublicSearchResultDto {
  @ApiProperty({ type: [String], description: 'Tipos de plan que ofrece' })
  planKinds!: string[];
}

/** Farmacia. */
export class PublicPharmacySummaryDto extends PublicSearchResultDto {
  @ApiProperty({ nullable: true, description: 'Si está abierta ahora' })
  openNow!: boolean | null;

  @ApiProperty({ nullable: true, description: 'Dirección visible' })
  address!: string | null;
}

/**
 * Resultado de «lo más cercano».
 *
 * `distanceKm` es **distancia en línea recta**, no de recorrido. La ficha
 * V65-12 exige ese rótulo literal en pantalla; el nombre lo dice para que nadie
 * lo confunda al conectarlo.
 */
export class PublicNearbyResultDto extends PublicSearchResultDto {
  @ApiProperty({ description: 'Distancia en línea recta, una decimal' })
  distanceKm!: number;

  @ApiProperty({ type: PublicLocationDto })
  location!: PublicLocationDto;
}

/** Publicación pública en la ficha de un perfil. */
export class PublicPostSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bodyText!: string;

  @ApiProperty({ description: 'Instante ISO-8601 en UTC' })
  publishedAt!: string;

  @ApiProperty({ type: [String], description: 'Vacío, nunca null' })
  mediaUrls!: string[];

  @ApiProperty()
  reactionCount!: number;

  @ApiProperty()
  commentCount!: number;
}

/** Ficha pública completa servida por `/p/:slug` y sus cuatro hermanas. */
/**
 * Un vínculo laboral de la trayectoria pública de un profesional.
 *
 * Misma tabla y mismos campos que `AffiliationResponseDto`
 * (`GET /profiles/practitioners/me/affiliations`), leída sin sesión y sin sus
 * identificadores internos (`id`, `practiceSiteId`) — acá nadie necesita
 * referenciar el registro, sólo leerlo.
 */
export class PublicAffiliationDto {
  @ApiProperty({
    description: 'Institución, tal como la declaró el profesional',
  })
  organizationName!: string;

  @ApiProperty({ description: 'Cargo ejercido' })
  roleTitle!: string;

  @ApiProperty({
    nullable: true,
    description: 'Servicio o departamento, si lo declaró',
  })
  departmentText!: string | null;

  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Inicio del vínculo',
  })
  startDate!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    nullable: true,
    description: 'Fin del vínculo, o null si sigue vigente',
  })
  endDate!: string | null;
}

export class PublicDirectoryProfileDto {
  @ApiProperty()
  kind!: Exclude<PublicResultKind, 'MEDICATION'>;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true })
  headline!: string | null;

  @ApiProperty({ nullable: true })
  biography!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true })
  coverUrl!: string | null;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty({ nullable: true })
  city!: string | null;

  @ApiProperty({ nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ type: PublicLocationDto, nullable: true })
  location!: PublicLocationDto | null;

  @ApiProperty({ type: [String] })
  specialties!: string[];

  @ApiProperty({
    type: [PublicAffiliationDto],
    description:
      'Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional',
  })
  trajectory!: PublicAffiliationDto[];

  @ApiProperty({ nullable: true })
  ratingAverage!: number | null;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty()
  acceptsReviews!: boolean;

  @ApiProperty({
    type: PublicVerifiedBadgeDto,
    description: 'El mismo sello y la misma semántica que en el buscador',
  })
  verifiedBadge!: PublicVerifiedBadgeDto;

  @ApiProperty({ description: 'Si tiene agenda publicada' })
  hasPublishedAgenda!: boolean;

  @ApiProperty({
    nullable: true,
    description: 'Primer día con hueco (YYYY-MM-DD)',
  })
  nextAvailableDate!: string | null;

  @ApiProperty({ type: [PublicPostSummaryDto], description: 'Máx. 20' })
  posts!: PublicPostSummaryDto[];

  @ApiProperty({ description: 'Alimenta el ETag y el <lastmod> del sitemap' })
  updatedAt!: string;
}

/**
 * Envoltura de página común a las siete búsquedas y a `nearby`.
 *
 * `totalHint` es una **pista**, no un total: con OpenSearch (P5) deja de ser
 * exacto por encima de 10 000. No sirve para paginar.
 */
export class PublicPageDto<T> {
  @ApiProperty({ description: 'Nunca null; vacío es []' })
  items!: T[];

  @ApiProperty({
    nullable: true,
    description: 'Cursor opaco; null = no hay más',
  })
  nextCursor!: string | null;

  @ApiProperty({ nullable: true, description: 'Aproximado' })
  totalHint!: number | null;

  @ApiProperty({ description: 'Instante ISO-8601 en UTC' })
  generatedAt!: string;
}

/** Página de la búsqueda unificada. */
export class PublicSearchPageDto extends PublicPageDto<PublicSearchResultDto> {}
/** Página de profesionales. */
export class PublicPractitionerPageDto extends PublicPageDto<PublicPractitionerSummaryDto> {}
/** Página de medicamentos. */
export class PublicMedicationPageDto extends PublicPageDto<PublicMedicationSummaryDto> {}
/** Página de organizaciones. */
export class PublicOrganizationPageDto extends PublicPageDto<PublicOrganizationSummaryDto> {}
/** Página de unidades de diagnóstico. */
export class PublicDiagnosticUnitPageDto extends PublicPageDto<PublicDiagnosticUnitSummaryDto> {}
/** Página de aseguradoras. */
export class PublicInsurerPageDto extends PublicPageDto<PublicInsurerSummaryDto> {}
/** Página de farmacias. */
export class PublicPharmacyPageDto extends PublicPageDto<PublicPharmacySummaryDto> {}
/** Página de resultados cercanos. */
export class PublicNearbyPageDto extends PublicPageDto<PublicNearbyResultDto> {}
