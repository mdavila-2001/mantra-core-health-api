import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuestas de la cara de lectura del módulo (carril E2: lecturas de
 * farmacia). A diferencia de las respuestas administrativas, acá los
 * `*_concept_id` no viajan crudos: cada concepto se resuelve a `{code,
 * display}` y las sedes llevan su dirección en texto — quien consume el
 * directorio no tiene catálogo con qué resolver un uuid.
 */

/** Un concepto ya resuelto a su forma legible. */
export class PharmacyConceptDto {
  /**
   * Código canónico del concepto.
   */
  @ApiProperty()
  code!: string;

  /**
   * Etiqueta legible del concepto.
   */
  @ApiProperty()
  display!: string;
}

/** Una sede dispensadora, con su dirección resuelta. */
export class PharmacySiteReadDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Dirección en una línea, o null si la sede no la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  addressText!: string | null;

  /**
   * Latitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  /**
   * Longitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  /**
   * Modo de dispensación, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  dispensingMode!: PharmacyConceptDto | null;

  /**
   * Valor de home delivery available mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * Valor de pickup available mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;
}

/** Una farmacia del directorio, con sus números de resumen. */
export class PharmacyDirectoryItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre para mostrar: el comercial si existe, si no la razón social.
   */
  @ApiProperty()
  name!: string;

  /**
   * Razón social registrada.
   */
  @ApiProperty()
  legalName!: string;

  /**
   * Tipo de farmacia, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  type!: PharmacyConceptDto | null;

  /**
   * Sedes activas de la farmacia.
   */
  @ApiProperty()
  siteCount!: number;

  /**
   * Productos activos publicados en su catálogo.
   */
  @ApiProperty()
  productCount!: number;

  /**
   * true si alguna sede ofrece entrega a domicilio.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * true si alguna sede ofrece retiro en mostrador.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;
}

/** El directorio de farmacias publicadas del tenant activo. */
export class PharmacyDirectoryResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacyDirectoryItemDto] })
  items!: PharmacyDirectoryItemDto[];

  /**
   * Cantidad de farmacias servidas.
   */
  @ApiProperty()
  count!: number;
}

/** Un punto WGS84. */
export class PharmacyGeoPointDto {
  /**
   * Latitud WGS84.
   */
  @ApiProperty()
  latitude!: number;

  /**
   * Longitud WGS84.
   */
  @ApiProperty()
  longitude!: number;
}

/** El perfil de una farmacia: su ficha y sus sedes con dirección. */
export class PharmacyDetailDto extends PharmacyDirectoryItemDto {
  /**
   * Valor de sites mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySiteReadDto] })
  sites!: PharmacySiteReadDto[];

  /**
   * NIT de la organización dueña de la farmacia: el número declarado en su
   * documento de identificación tributaria (`NIT_EXHIBICION`) del alta
   * institucional. `null` si no se declaró, o si la organización no es una
   * farmacia (ver `companyType`).
   */
  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  /**
   * Forma societaria de la organización (`legal_entity_type_concept_id` de
   * `directory.tenants`): `UNIPERSONAL`, `SRL`, `LTDA`, `SA`,
   * `SOCIEDAD_COLECTIVA`, `COMANDITA_SIMPLE`, `COMANDITA_ACCIONES`,
   * `SUCURSAL_EXTRANJERA` o una figura de otra jurisdicción. No es el `type`
   * (tipo de farmacia) ni `ownership_type` (pública/privada).
   *
   * `null` cuando la organización no eligió forma (la genérica `COMPANY` de
   * las filas anteriores al diccionario no se sirve como si fuera una), y
   * cuando la organización dueña no es de tipo farmacia: en ese caso sus datos
   * legales son de otra entidad y atribuírselos a esta farmacia sería falso.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  companyType!: PharmacyConceptDto | null;

  /**
   * Dirección legal de la central (casa matriz de la organización:
   * `common.addresses` vigente de uso laboral), en una línea. `null` si no la
   * registró. Mismo criterio de atribución que `companyType`.
   */
  @ApiPropertyOptional({ nullable: true })
  legalAddressText!: string | null;

  /**
   * Punto de la central en el mapa, si la casa matriz tiene coordenadas.
   */
  @ApiPropertyOptional({ type: PharmacyGeoPointDto, nullable: true })
  headquarters!: PharmacyGeoPointDto | null;
}

/** Una licencia de la farmacia (`pharmacy.pharmacy_licenses`). */
export class PharmacyLicenseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Tipo de licencia, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  type!: PharmacyConceptDto | null;

  /**
   * Número de la licencia.
   */
  @ApiProperty()
  number!: string;

  /**
   * Sede a la que corresponde; `null` si es de la farmacia entera.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  siteId!: string | null;

  /**
   * Nombre de esa sede, si corresponde a una.
   */
  @ApiPropertyOptional({ nullable: true })
  siteName!: string | null;

  /**
   * Jurisdicción, resuelta.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  jurisdiction!: PharmacyConceptDto | null;

  /**
   * Inicio de vigencia (fecha, sin hora).
   */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validFrom!: string | null;

  /**
   * Fin de vigencia (fecha, sin hora).
   */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  validTo!: string | null;

  /**
   * Días de calendario hasta el vencimiento, negativo si ya venció; `null`
   * sin fin de vigencia. Lo calcula el servidor para que el aviso sea el mismo
   * en todas las pantallas.
   */
  @ApiPropertyOptional({ nullable: true })
  daysToExpiry!: number | null;

  /**
   * Estado de verificación, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  verificationStatus!: PharmacyConceptDto | null;

  /**
   * Archivo de respaldo (`common.files`), si se adjuntó.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  evidenceFileId!: string | null;
}

/** La carpeta de licencias de una farmacia. */
export class PharmacyLicenseListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacyLicenseDto] })
  items!: PharmacyLicenseDto[];

  /**
   * Cantidad de licencias servidas.
   */
  @ApiProperty()
  count!: number;
}

/** Una persona que representa o gestiona la organización de la farmacia. */
export class PharmacyContactPersonDto {
  /**
   * Rol canónico: `LEGAL_REPRESENTATIVE`, `GENERAL_MANAGER`,
   * `COMMERCIAL_MANAGER` o `MARKETING_MANAGER`.
   */
  @ApiProperty()
  role!: string;

  /**
   * Nombre completo, tal como figura en `profiles.persons`.
   */
  @ApiProperty()
  fullName!: string;

  /**
   * Correo vigente preferido, si lo tiene.
   */
  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  /**
   * Celular o teléfono vigente preferido, si lo tiene.
   */
  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
}

/**
 * El representante legal y las gerencias de la organización de la farmacia.
 * El documento de identidad de las personas **no** viaja: esta lectura es para
 * ubicarlas, no para identificarlas.
 */
export class PharmacyContactsResponseDto {
  /**
   * El representante legal, o `null` si la organización no lo registró.
   */
  @ApiPropertyOptional({ type: PharmacyContactPersonDto, nullable: true })
  legalRepresentative!: PharmacyContactPersonDto | null;

  /**
   * Las gerencias registradas, en orden canónico (general, comercial,
   * marketing).
   */
  @ApiProperty({ type: [PharmacyContactPersonDto] })
  executives!: PharmacyContactPersonDto[];
}

/** Un producto del catálogo, con su medicamento del vademécum resuelto. */
export class PharmacyProductReadDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia dueña del catálogo.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  genericName!: string | null;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  packageSizeText!: string | null;

  /**
   * Forma farmacéutica, resuelta.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  dosageForm!: PharmacyConceptDto | null;

  /**
   * Medicamento del vademécum (`medication_concept_id`), resuelto a su código
   * ATC y su nombre. null cuando el producto no está amarrado al vademécum.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  medication!: PharmacyConceptDto | null;

  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  requiresPrescription!: boolean | null;
}

/** Resultado de la búsqueda de productos, acotado y con el recorte declarado. */
export class PharmacyProductSearchResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacyProductReadDto] })
  items!: PharmacyProductReadDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron productos fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/** Un precio vigente de un producto en una sede. */
export class PharmacySitePriceDto {
  /**
   * Identificador asociado a product.
   */
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty()
  productCode!: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  genericName!: string | null;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({ nullable: true })
  packageSizeText!: string | null;

  /**
   * Medicamento del vademécum, resuelto.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  medication!: PharmacyConceptDto | null;

  /**
   * Si el producto exige receta médica para despacharse.
   */
  @ApiPropertyOptional({ nullable: true })
  requiresPrescription!: boolean | null;

  /**
   * Identificador asociado a price list.
   */
  @ApiProperty({ format: 'uuid' })
  priceListId!: string;

  /**
   * Código de la lista que publica el precio.
   */
  @ApiProperty()
  priceListCode!: string;

  /**
   * Moneda de la lista, resuelta.
   */
  @ApiPropertyOptional({ type: PharmacyConceptDto, nullable: true })
  currency!: PharmacyConceptDto | null;

  /**
   * Precio unitario, como texto exacto (numeric de BD).
   */
  @ApiProperty()
  unitAmount!: string;

  /**
   * Impuesto, si la lista lo desglosa.
   */
  @ApiPropertyOptional({ nullable: true })
  taxAmount!: string | null;

  /**
   * Lo que paga el paciente, si difiere del unitario.
   */
  @ApiPropertyOptional({ nullable: true })
  patientAmount!: string | null;

  /**
   * Cantidad mínima de compra, si la lista la exige.
   */
  @ApiPropertyOptional({ nullable: true })
  minimumQuantity!: string | null;

  /**
   * Desde cuándo rige este precio.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: Date;

  /**
   * Hasta cuándo rige, si la versión declara fin.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo!: Date | null;
}

/** Los precios públicos vigentes de una sede. */
export class PharmacySitePricesResponseDto {
  /**
   * Identificador asociado a site.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySitePriceDto] })
  items!: PharmacySitePriceDto[];

  /**
   * Cantidad de precios servidos.
   */
  @ApiProperty()
  count!: number;
}

/**
 * Una sede publicada, suelta, tal como la lista `GET /pharmacy/sites`
 * (carril A, H4). Campos idénticos a `PharmacySite` del front, para que el
 * front pueda dejar de simularla sin renombrar nada.
 */
export class PharmacySiteListItemDto {
  /**
   * Identificador asociado a site.
   */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /**
   * Nombre de la sede.
   */
  @ApiProperty()
  siteName!: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /**
   * Nombre de la farmacia.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Dirección en una línea, o null si la sede no la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  addressText!: string | null;

  /**
   * Latitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;

  /**
   * Longitud WGS84, si la dirección la registró.
   */
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;

  /**
   * Distancia Haversine en km al origen consultado, con un decimal. `null`
   * sin origen o sin coordenadas.
   */
  @ApiPropertyOptional({ nullable: true })
  distanceKm!: number | null;

  /**
   * true si la sede ofrece entrega a domicilio.
   */
  @ApiPropertyOptional({ nullable: true })
  homeDeliveryAvailable!: boolean | null;

  /**
   * true si la sede ofrece retiro en mostrador.
   */
  @ApiPropertyOptional({ nullable: true })
  pickupAvailable!: boolean | null;

  /**
   * Productos activos publicados por la farmacia dueña de esta sede.
   */
  @ApiProperty()
  productCount!: number;
}

/** Las sedes publicadas del tenant activo, sueltas. */
export class PharmacySiteListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PharmacySiteListItemDto] })
  items!: PharmacySiteListItemDto[];

  /**
   * Cantidad de sedes servidas.
   */
  @ApiProperty()
  count!: number;
}
