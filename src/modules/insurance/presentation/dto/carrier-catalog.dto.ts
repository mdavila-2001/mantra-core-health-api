import { ApiProperty } from '@nestjs/swagger';

/** Un plan de salud tal como lo elige quien se registra. */
export class CarrierCatalogPlanDto {
  /** Identificador del plan; es lo que viaja en el alta. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código del plan dentro de su aseguradora.
   *
   * `BASE` es el plan comodín de cada compañía: la opción «no sé cuál tengo».
   * Se expone para que la pantalla pueda nombrarlo así en vez de mostrar el
   * nombre técnico con el que está guardado.
   */
  @ApiProperty({ example: 'RED_MAX' })
  code!: string;

  /** Cómo se llama el plan. */
  @ApiProperty({ example: 'Red Max' })
  name!: string;
}

/** Una aseguradora del catálogo boliviano, con sus planes de salud. */
export class CarrierCatalogEntryDto {
  /** Identificador de la aseguradora. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código estable de la aseguradora. */
  @ApiProperty({ example: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A' })
  code!: string;

  /** Cómo se la nombra en el giro comercial. */
  @ApiProperty({ example: 'BISA Seguros y Reaseguros S.A.' })
  name!: string;

  /** Nombre con el que está constituida. */
  @ApiProperty()
  legalName!: string;

  /**
   * Si es un seguro público o de la seguridad social (CNS, CPS, SUS…).
   *
   * **Se deriva del catálogo sembrado, no de la base.** El modelo tiene una
   * sola tabla de pagador y ninguna columna que separe una caja de salud de una
   * compañía de seguros, así que la fuente de verdad es el mismo catálogo que
   * decidió qué sembrar. Consecuencia a tener presente: una aseguradora dada de
   * alta por otra vía no aparece en este listado hasta que el modelo tenga un
   * tipo de pagador persistido.
   */
  @ApiProperty()
  isPublic!: boolean;

  /** Sus planes de salud activos. */
  @ApiProperty({ type: [CarrierCatalogPlanDto] })
  plans!: CarrierCatalogPlanDto[];
}

/** Respuesta de `GET /insurance-carrier-catalog`. */
export class CarrierCatalogResponseDto {
  /** Las aseguradoras del catálogo boliviano, privadas y públicas. */
  @ApiProperty({ type: [CarrierCatalogEntryDto] })
  carriers!: CarrierCatalogEntryDto[];
}
