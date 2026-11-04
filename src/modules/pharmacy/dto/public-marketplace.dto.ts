import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicOfficialMedicineDto } from './public-official-medicine.dto';

/**
 * La vitrina pública de medicamentos: exhibición y **consulta de
 * disponibilidad**, nada más.
 *
 * ## Qué no hay acá, y por qué no lo va a haber
 *
 * No hay carrito, ni reserva, ni checkout, ni identificador de producto que
 * sirva para pedir nada. AloVida no vende medicamentos: muestra qué farmacia
 * cerca tuyo tiene lo que buscás, a qué precio y a qué distancia. Un DTO que
 * expusiera `productId` estaría invitando a construir la compra encima, y la
 * regla del carril es que la compra no existe en la superficie anónima.
 *
 * ## Los importes son texto
 *
 * `numeric` en la base, texto acá: un `number` de JavaScript no representa
 * 0.10 sin error, y un precio que se corre un centavo entre la farmacia y la
 * pantalla es un precio equivocado.
 */

/** Un medicamento del vademécum, tal como la vitrina lo exhibe. */
export class PublicMedicationCardDto {
  /**
   * Concepto del vademécum. Es la llave con la que se pide la disponibilidad;
   * no identifica a ninguna farmacia ni a ningún producto en particular.
   */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /**
   * Código ATC de clasificación anatómico-terapéutica (p. ej. `C09CA01`).
   */
  @ApiProperty()
  atcCode!: string;

  /**
   * Nombre del principio activo.
   */
  @ApiProperty()
  genericName!: string;

  /**
   * Grupo terapéutico legible, derivado de la primera letra del ATC.
   */
  @ApiProperty()
  therapeuticGroup!: string;

  /**
   * Marcas con que las farmacias lo publican, sin repetir.
   */
  @ApiProperty({ type: [String] })
  brands!: string[];

  /**
   * Presentaciones publicadas (p. ej. «500 mg · Caja x 20 tabletas»).
   */
  @ApiProperty({ type: [String] })
  presentations!: string[];

  /**
   * `true` si alguna de las publicaciones lo marca como venta bajo receta.
   */
  @ApiProperty()
  requiresPrescription!: boolean;

  /**
   * Precio más bajo publicado hoy, como texto exacto. `null` si ninguna
   * farmacia lo publica (medicamento del vademécum sin oferta).
   */
  @ApiProperty({ type: String, nullable: true })
  priceFrom!: string | null;

  /**
   * Precio más alto publicado hoy, como texto exacto.
   */
  @ApiProperty({ type: String, nullable: true })
  priceTo!: string | null;

  /**
   * Moneda de los importes (código ISO).
   */
  @ApiProperty({ type: String, nullable: true })
  currency!: string | null;

  /**
   * En cuántas farmacias está disponible hoy dentro del alcance consultado.
   */
  @ApiProperty()
  pharmacyCount!: number;

  /**
   * Distancia a la farmacia más cercana que lo tiene, en km y en línea recta.
   * `null` si la consulta no llevó origen.
   */
  @ApiPropertyOptional({ nullable: true })
  nearestKm!: number | null;

  /**
   * Para qué se usa, según su grupo ATC (OMS), del grupo más específico al
   * más general. Es una clasificación, no una indicación médica.
   */
  @ApiProperty({ type: [String], example: ['Dolor abdominal y cólicos'] })
  uses!: string[];

  /**
   * Por qué salió en la búsqueda: nombre, marca, código o uso. Ausente sin
   * texto de búsqueda.
   */
  @ApiPropertyOptional({
    enum: ['name', 'brand', 'code', 'use'],
    nullable: true,
  })
  matchedBy?: 'name' | 'brand' | 'code' | 'use' | null;

  /** El uso que lo encontró, cuando `matchedBy` es `use`. */
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Dolor abdominal y cólicos',
  })
  matchedUse?: string | null;
}

/** La página de la vitrina. */
export class PublicMedicationPageDto {
  /**
   * Los medicamentos de esta página.
   */
  @ApiProperty({ type: [PublicMedicationCardDto] })
  items!: PublicMedicationCardDto[];

  /**
   * Cuántos medicamentos cumplen el filtro en total.
   */
  @ApiProperty()
  total!: number;

  /**
   * Los grupos terapéuticos presentes en el catálogo, para los filtros.
   */
  @ApiProperty({ type: [String] })
  groups!: string[];

  /**
   * El texto corregido que de verdad se buscó cuando lo escrito no daba nada
   * («ibopofeno» → «ibuprofeno»); `null` si no hizo falta o se pidió `exact`.
   */
  @ApiPropertyOptional({ type: String, nullable: true, example: 'ibuprofeno' })
  correctedQuery!: string | null;

  /**
   * Products of the official health registry (AGEMED, CIMA, INVIMA, ANVISA)
   * that match the search, whether or not a pharmacy publishes them.
   */
  @ApiProperty({ type: [PublicOfficialMedicineDto] })
  officialProducts!: PublicOfficialMedicineDto[];

  /**
   * Instante en que se resolvió la consulta.
   */
  @ApiProperty()
  generatedAt!: string;
}

/** Una farmacia que tiene el medicamento consultado. */
export class PublicMedicationOfferDto {
  /**
   * Slug del perfil público de la farmacia: el enlace a su ficha.
   */
  @ApiProperty()
  pharmacySlug!: string;

  /**
   * Nombre comercial de la farmacia.
   */
  @ApiProperty()
  pharmacyName!: string;

  /**
   * Dirección en una línea.
   */
  @ApiPropertyOptional({ nullable: true })
  addressText!: string | null;

  /**
   * Ciudad.
   */
  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  /**
   * Latitud WGS84, para el mapa.
   */
  @ApiProperty()
  latitude!: number;

  /**
   * Longitud WGS84, para el mapa.
   */
  @ApiProperty()
  longitude!: number;

  /**
   * Distancia en línea recta al origen consultado, en km. `null` sin origen.
   */
  @ApiPropertyOptional({ nullable: true })
  distanceKm!: number | null;

  /**
   * Marca con que esta farmacia lo publica.
   */
  @ApiPropertyOptional({ nullable: true })
  brandName!: string | null;

  /**
   * Presentación publicada.
   */
  @ApiPropertyOptional({ nullable: true })
  presentation!: string | null;

  /**
   * Lo que paga el paciente, texto exacto.
   */
  @ApiProperty()
  price!: string;

  /**
   * Moneda del importe.
   */
  @ApiProperty()
  currency!: string;

  /**
   * `true` si la farmacia reporta unidades disponibles hoy.
   */
  @ApiProperty()
  inStock!: boolean;

  /**
   * `true` si la sede hace entrega a domicilio.
   */
  @ApiProperty()
  homeDelivery!: boolean;

  /**
   * `true` si se puede retirar en la sede.
   */
  @ApiProperty()
  pickup!: boolean;

  /**
   * `true` si esta publicación exige receta médica.
   */
  @ApiProperty()
  requiresPrescription!: boolean;
}

/** La disponibilidad de un medicamento, farmacia por farmacia. */
export class PublicMedicationAvailabilityDto {
  /**
   * La ficha del medicamento consultado.
   */
  @ApiProperty({ type: PublicMedicationCardDto })
  medication!: PublicMedicationCardDto;

  /**
   * Las farmacias que lo publican, ordenadas por distancia y después precio.
   */
  @ApiProperty({ type: [PublicMedicationOfferDto] })
  offers!: PublicMedicationOfferDto[];

  /**
   * Instante en que se resolvió la consulta.
   */
  @ApiProperty()
  generatedAt!: string;
}
