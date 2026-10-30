import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 200 de `GET /pharmacy/prescription-shares/:token` (FAR-02, `CONTRATO.md` §2):
 * la receta compartida, cruzada con el catálogo de las farmacias del tenant
 * que la abre.
 *
 * Del paciente sale solo lo enmascarado (S-4). Dos agregados al contrato:
 * `pharmacyId` en cada producto (sin él no se puede llamar al `PUT` de
 * disponibilidad del §4) y `outOfStockDeclared` (R-02-2: un producto marcado
 * «no tengo» en el catálogo no está en ninguna sede, y la pantalla lo dice).
 */

/** Matrícula del prescriptor. */
export class PharmacyPrescriptionLicenseDto {
  @ApiProperty()
  number!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  authority!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'PENDING'] })
  state!: 'ACTIVE' | 'PENDING';
}

/** Quién emitió la receta. */
export class PharmacyPrescriptionPrescriberDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ type: PharmacyPrescriptionLicenseDto, nullable: true })
  license!: PharmacyPrescriptionLicenseDto | null;
}

/**
 * El paciente, enmascarado. No hay ninguna otra clave del paciente en la
 * respuesta (REQ-FAR-02-004).
 */
export class PharmacyPrescriptionPatientDto {
  /** Iniciales de cada parte del nombre: `L. P. Q.`. */
  @ApiPropertyOptional({ type: String, nullable: true, example: 'L. P. Q.' })
  maskedName!: string | null;

  /** Últimos 3 dígitos del documento nacional vigente. */
  @ApiPropertyOptional({ type: String, nullable: true, example: '123' })
  documentLast3!: string | null;
}

/** Una sede activa de la farmacia del producto, con su disponibilidad. */
export class PharmacyPrescriptionSiteDto {
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  siteName!: string;

  /** Regla única de existencias por sede (`site-product-availability.ts`). */
  @ApiProperty()
  available!: boolean;

  /**
   * Disponible en la sede; `0` si no está disponible. `null` si está
   * disponible pero la sede no lleva lotes y el producto no declaró conteo.
   */
  @ApiPropertyOptional({ type: Number, nullable: true })
  quantity!: number | null;

  /**
   * ISO 8601: el `updated_at` más antiguo de las posiciones de stock con
   * cantidad disponible del producto en la sede, como en «Dónde comprar».
   * `null` si la sede no lleva lotes o no tiene posición disponible.
   */
  @ApiPropertyOptional({ type: String, nullable: true })
  stockUpdatedAt!: string | null;
}

/** Un producto del catálogo que surte el fármaco del ítem. */
export class PharmacyPrescriptionMatchDto {
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty({ format: 'uuid' })
  pharmacyProductId!: string;

  /** Marca, o genérico, o código del producto. */
  @ApiProperty()
  name!: string;

  /**
   * Lo que paga el paciente en la lista pública general de la farmacia
   * (`numeric`, 2 decimales o más). `null` si solo tiene precios por sede o
   * ninguno.
   */
  @ApiPropertyOptional({ type: String, nullable: true })
  price!: string | null;

  /** Código del concepto de moneda de esa lista. */
  @ApiPropertyOptional({ type: String, nullable: true })
  currencyCode!: string | null;

  @ApiProperty()
  requiresPrescription!: boolean;

  /**
   * La farmacia lo marcó «no tengo» para todas sus sedes: ninguna lo ofrece y
   * una sede no apaga esa marca (`CONTRATO.md` §4).
   */
  @ApiProperty()
  outOfStockDeclared!: boolean;

  @ApiProperty({ type: [PharmacyPrescriptionSiteDto] })
  sites!: PharmacyPrescriptionSiteDto[];
}

/** Un ítem vigente de la receta. */
export class PharmacyPrescriptionItemDto {
  @ApiProperty({ format: 'uuid' })
  medicationRequestId!: string;

  @ApiProperty({ format: 'uuid' })
  medicationConceptId!: string;

  /** Nombre del fármaco en el vademécum. */
  @ApiPropertyOptional({ type: String, nullable: true })
  display!: string | null;

  /** Dosis y frecuencia, en una línea. */
  @ApiPropertyOptional({ type: String, nullable: true })
  dosageText!: string | null;

  /**
   * Con control de cantidad, lo recetado **del fármaco** en la receta (la
   * suma si el mismo fármaco está en más de un ítem: esos ítems repiten las
   * tres cantidades del fármaco y no se suman). Sin control, la del ítem.
   */
  @ApiPropertyOptional({ type: Number, nullable: true })
  prescribedQuantity!: number | null;

  /**
   * Código del concepto de unidad de lo recetado, tal como está en la
   * terminología: `UNIT_{bottle}`, `UNIT_{tube}` (el §2 los nombra sin el
   * prefijo).
   */
  @ApiPropertyOptional({ type: String, nullable: true })
  unitCode!: string | null;

  /**
   * Lo ya entregado del fármaco en esta receta. `null` sin control de
   * cantidad (unidad no comparable o sin cantidad recetada, D-5): no se
   * consultó.
   */
  @ApiPropertyOptional({ type: Number, nullable: true })
  dispensedQuantity!: number | null;

  /**
   * Recetado − entregado − reservado (`prescription-balance.ts`). `null` sin
   * control de cantidad: la pantalla dice «Sin control de cantidad».
   */
  @ApiPropertyOptional({ type: Number, nullable: true })
  remainingQuantity!: number | null;

  /** Vacío si ninguna farmacia del tenant tiene el fármaco. */
  @ApiProperty({ type: [PharmacyPrescriptionMatchDto] })
  matches!: PharmacyPrescriptionMatchDto[];
}

/** La receta compartida, como la ve una farmacia. */
export class PharmacyPrescriptionShareDto {
  @ApiProperty({ format: 'uuid' })
  shareId!: string;

  /** ISO 8601: emisión más antigua de los ítems vigentes. */
  @ApiPropertyOptional({ type: String, nullable: true })
  issuedAt!: string | null;

  /** ISO 8601: `valid_to` más próximo de los ítems vigentes. */
  @ApiPropertyOptional({ type: String, nullable: true })
  validTo!: string | null;

  @ApiProperty({ type: PharmacyPrescriptionPrescriberDto })
  prescriber!: PharmacyPrescriptionPrescriberDto;

  @ApiProperty({ type: PharmacyPrescriptionPatientDto })
  patient!: PharmacyPrescriptionPatientDto;

  @ApiProperty({ type: [PharmacyPrescriptionItemDto] })
  items!: PharmacyPrescriptionItemDto[];
}
