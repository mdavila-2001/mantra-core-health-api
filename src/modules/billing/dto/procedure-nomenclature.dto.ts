import { ApiProperty } from '@nestjs/swagger';

/**
 * Una entrada del nomenclador de procedimientos.
 *
 * Es el **arancel de referencia**, no el catálogo de la práctica: acá no hay
 * nada que un profesional haya dado de alta. Sirve para importar: se elige una
 * entrada y de ella nace un servicio del catálogo.
 */
export class ProcedureNomenclatureItemDto {
  /** Concepto de terminología que representa el procedimiento. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Código del arancel, tal cual lo publica el documento de origen. */
  @ApiProperty({ example: 'procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL' })
  code!: string;

  /** Nombre del procedimiento. */
  @ApiProperty({ example: 'General' })
  display!: string;

  /** Especialidad bajo la que el arancel lo agrupa. */
  @ApiProperty({ nullable: true, type: String, example: 'Auditoría Médica' })
  specialty!: string | null;

  /** Grupo dentro de la especialidad, si el arancel lo declara. */
  @ApiProperty({ nullable: true, type: String, example: 'I' })
  group!: string | null;

  /**
   * Precio de referencia, como cadena.
   *
   * **Es de referencia y de una unidad que puede no ser dinero**: ver
   * {@link priceUnit}. No se convierte a moneda acá — el factor de conversión
   * de la UMA no está declarado en ninguna parte del producto.
   */
  @ApiProperty({ nullable: true, type: String, example: '150' })
  referencePrice!: string | null;

  /**
   * Unidad del precio: `UMA` o `USD`.
   *
   * `UMA` **no es una moneda**: es la unidad de cuenta del arancel de
   * honorarios de Santa Cruz. Viaja tal cual para que quien importe sepa qué
   * está copiando.
   */
  @ApiProperty({ nullable: true, type: String, example: 'UMA' })
  priceUnit!: string | null;

  /**
   * Si el texto de origen necesita revisión humana.
   *
   * Son las 228 entradas que salieron dañadas del reconocimiento óptico del
   * arancel —se ven a simple vista: «Angioplastia periférica por balén»—. El
   * catálogo las marca y la pantalla tiene que avisarlo: importar una de éstas
   * en silencio mete un nombre y un precio dudosos en la lista de un
   * profesional.
   */
  @ApiProperty({ example: false })
  ocrSuspect!: boolean;
}

/** Página del nomenclador, por cursor opaco. */
export class ProcedureNomenclatureResponseDto {
  /** Entradas de esta página. */
  @ApiProperty({ type: [ProcedureNomenclatureItemDto] })
  items!: ProcedureNomenclatureItemDto[];

  /** Cursor de la página siguiente, o `null` si esta es la última. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/**
 * Una especialidad del nomenclador, con cuántos procedimientos tiene.
 *
 * Existe para que el filtro se pueda dibujar **sin traer las 4408 entradas**:
 * la pantalla pide las especialidades una vez y después pagina dentro de la
 * elegida.
 */
export class ProcedureSpecialtyDto {
  /** Nombre de la especialidad, tal cual lo publica el arancel. */
  @ApiProperty({ example: 'Cardiología' })
  specialty!: string;

  /** Cuántos procedimientos agrupa. */
  @ApiProperty({ example: 87 })
  count!: number;
}

/** Las especialidades del nomenclador. */
export class ProcedureSpecialtiesResponseDto {
  /** Especialidades, ordenadas alfabéticamente en español. */
  @ApiProperty({ type: [ProcedureSpecialtyDto] })
  items!: ProcedureSpecialtyDto[];
}
