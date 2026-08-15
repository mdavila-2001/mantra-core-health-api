import { ApiProperty } from '@nestjs/swagger';

/**
 * Un concepto del catálogo resuelto a su par legible.
 *
 * Los endpoints de escritura del módulo devuelven `*_concept_id` crudos porque
 * su cliente es otro sistema. Las lecturas tienen por cliente una pantalla, y
 * un uuid no se puede pintar: se resuelve acá, en la frontera, contra
 * `terminology.catalog_concepts`.
 */
export class InsuranceConceptDto {
  /** Código estable del concepto. Es lo que una pantalla puede condicionar. */
  @ApiProperty({ example: 'CARRIER_ACTIVE' })
  code!: string;

  /** Etiqueta legible en español. */
  @ApiProperty({ example: 'Aseguradora activa' })
  display!: string;
}

/**
 * Una aseguradora del tenant activo, con el volumen de su catálogo.
 *
 * Los recuentos no son adorno: son lo que distingue una aseguradora con
 * catálogo publicado de una recién dada de alta, y evitan que la pantalla
 * tenga que pedir tres listados sólo para decidir si mostrar un vacío.
 */
export class CarrierSummaryDto {
  /** Identificador de la aseguradora. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código de la aseguradora dentro de la plataforma. */
  @ApiProperty({ example: 'ASEG-001' })
  carrierCode!: string;

  /** Razón social registrada. */
  @ApiProperty()
  legalName!: string;

  /** Identificador ante el regulador de seguros. */
  @ApiProperty({ nullable: true, type: String })
  regulatorIdentifier!: string | null;

  /** Jurisdicción bajo la que opera, si se declaró. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  jurisdiction!: InsuranceConceptDto | null;

  /** Estado de la aseguradora. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /**
   * Estado de verificación. Se sirve siempre y sin traducir a un booleano:
   * «declarada» y «verificada» son cosas distintas y la pantalla debe poder
   * decirlo, que es exactamente lo que la especificación exige del perfil.
   */
  @ApiProperty({ type: InsuranceConceptDto })
  verification!: InsuranceConceptDto;

  /** Productos activos del catálogo. */
  @ApiProperty()
  productCount!: number;

  /** Planes activos, sumados sobre todos los productos. */
  @ApiProperty()
  planCount!: number;

  /** Redes de prestadores activas. */
  @ApiProperty()
  networkCount!: number;

  /** Alta de la fila. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

/** Listado de aseguradoras del tenant activo. No pagina: hay una por tenant. */
export class CarrierDirectoryResponseDto {
  /** Las aseguradoras visibles. */
  @ApiProperty({ type: [CarrierSummaryDto] })
  items!: CarrierSummaryDto[];

  /** Cuántas trae la respuesta. */
  @ApiProperty()
  count!: number;
}

/** Un beneficio de un plan, con sus topes económicos. */
export class PlanBenefitDto {
  /** Identificador del beneficio. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Categoría de la prestación cubierta. */
  @ApiProperty({ type: InsuranceConceptDto })
  category!: InsuranceConceptDto;

  /** Servicio concreto, cuando el beneficio se declara a ese nivel. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  service!: InsuranceConceptDto | null;

  /**
   * Porcentaje de cobertura.
   *
   * Viaja como texto, igual que los importes: la columna es `numeric` y
   * convertirla a `number` en la frontera perdería precisión en los decimales
   * que definen una cobertura.
   */
  @ApiProperty({ nullable: true, type: String })
  coveragePercent!: string | null;

  /** Copago fijo por atención. */
  @ApiProperty({ nullable: true, type: String })
  copayAmount!: string | null;

  /** Deducible aplicable. */
  @ApiProperty({ nullable: true, type: String })
  deductibleAmount!: string | null;

  /** Tope anual del beneficio. */
  @ApiProperty({ nullable: true, type: String })
  annualLimitAmount!: string | null;

  /** Si la prestación exige autorización previa. */
  @ApiProperty({ nullable: true, type: Boolean })
  requiresPriorAuthorization!: boolean | null;

  /** Inicio de vigencia (fecha, sin hora). */
  @ApiProperty({ nullable: true, type: String })
  effectiveFrom!: string | null;

  /** Fin de vigencia (fecha, sin hora). */
  @ApiProperty({ nullable: true, type: String })
  effectiveTo!: string | null;
}

/** Un plan de un producto, con sus beneficios vigentes. */
export class PlanDto {
  /** Identificador del plan. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código del plan dentro del producto. */
  @ApiProperty()
  planCode!: string;

  /** Nombre comercial del plan. */
  @ApiProperty()
  name!: string;

  /** Tipo de plan. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  planType!: InsuranceConceptDto | null;

  /** Moneda en la que se expresan sus importes. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  currency!: InsuranceConceptDto | null;

  /** Inicio de vigencia. */
  @ApiProperty({ nullable: true, type: String })
  effectiveFrom!: string | null;

  /** Fin de vigencia. */
  @ApiProperty({ nullable: true, type: String })
  effectiveTo!: string | null;

  /** Estado del plan. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /**
   * Archivo del condicionado contratado, si se cargó.
   *
   * Se sirve el identificador y no un enlace: la descarga pasa por el módulo de
   * archivos, que es quien aplica su propio control de acceso.
   */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  policyDocumentFileId!: string | null;

  /** Beneficios activos del plan. */
  @ApiProperty({ type: [PlanBenefitDto] })
  benefits!: PlanBenefitDto[];
}

/** Un producto de la aseguradora, con sus planes. */
export class ProductDto {
  /** Identificador del producto. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código del producto. */
  @ApiProperty()
  productCode!: string;

  /** Nombre comercial. */
  @ApiProperty()
  name!: string;

  /** Tipo de producto. */
  @ApiProperty({ type: InsuranceConceptDto })
  productType!: InsuranceConceptDto;

  /** Segmento de mercado al que apunta. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  marketSegment!: InsuranceConceptDto | null;

  /** Estado del producto. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /** Planes activos del producto. */
  @ApiProperty({ type: [PlanDto] })
  plans!: PlanDto[];
}

/** Una red de prestadores de la aseguradora. */
export class ProviderNetworkDto {
  /** Identificador de la red. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código de la red. */
  @ApiProperty()
  networkCode!: string;

  /** Nombre de la red. */
  @ApiProperty()
  name!: string;

  /** Tipo de red. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  networkType!: InsuranceConceptDto | null;

  /** Estado de la red. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /** Inicio de vigencia del convenio marco. */
  @ApiProperty({ nullable: true, type: String })
  effectiveFrom!: string | null;

  /** Fin de vigencia. */
  @ApiProperty({ nullable: true, type: String })
  effectiveTo!: string | null;

  /** Prestadores con membresía activa. */
  @ApiProperty()
  memberCount!: number;
}

/**
 * Ficha de la aseguradora: catálogo comercial y red.
 *
 * Reúne producto → plan → beneficio y las redes en una sola respuesta porque la
 * pantalla de catálogo los muestra juntos; pedirlos por separado obligaría a
 * cuatro viajes y a que el cliente recompusiera la jerarquía.
 */
export class CarrierDetailDto extends CarrierSummaryDto {
  /** Catálogo comercial activo. */
  @ApiProperty({ type: [ProductDto] })
  products!: ProductDto[];

  /** Redes de prestadores activas. */
  @ApiProperty({ type: [ProviderNetworkDto] })
  networks!: ProviderNetworkDto[];
}

/** Vínculo vigente de un broker con una aseguradora. */
export class BrokerAgreementDto {
  /** Identificador del acuerdo. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Aseguradora representada. */
  @ApiProperty({ format: 'uuid' })
  insuranceCarrierId!: string;

  /** Razón social de la aseguradora, para no obligar a otra consulta. */
  @ApiProperty()
  carrierLegalName!: string;

  /** Código del acuerdo. */
  @ApiProperty()
  agreementCode!: string;

  /** Esquema de comisión pactado. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  commissionModel!: InsuranceConceptDto | null;

  /** Inicio de la vinculación. */
  @ApiProperty({ nullable: true, type: String })
  effectiveFrom!: string | null;

  /** Fin de la vinculación. */
  @ApiProperty({ nullable: true, type: String })
  effectiveTo!: string | null;

  /** Estado del acuerdo. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /**
   * Si el acuerdo está vigente **hoy**: activo y dentro de sus fechas.
   *
   * Se calcula en el servidor y no en la pantalla para que «representa a esta
   * aseguradora» signifique lo mismo en todos los clientes. De esto depende la
   * regla de la especificación que prohíbe a un broker presentarse como
   * representante sin vinculación vigente.
   */
  @ApiProperty()
  current!: boolean;

  /** Contrato firmado, si se cargó. */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  contractFileId!: string | null;
}

/** Un broker del tenant activo. */
export class BrokerSummaryDto {
  /** Identificador del broker. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código del broker. */
  @ApiProperty()
  brokerCode!: string;

  /** Razón social o nombre registrado. */
  @ApiProperty()
  legalName!: string;

  /** Matrícula o número de licencia declarado. */
  @ApiProperty({ nullable: true, type: String })
  licenseNumber!: string | null;

  /** Jurisdicción habilitante. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  jurisdiction!: InsuranceConceptDto | null;

  /** Estado del broker. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;

  /** Estado de verificación de sus credenciales. */
  @ApiProperty({ type: InsuranceConceptDto })
  verification!: InsuranceConceptDto;

  /**
   * Broker sin ninguna vinculación vigente.
   *
   * Es la distinción «independiente / vinculado» de la especificación,
   * derivada de los acuerdos y no de un campo declarativo: un broker no puede
   * quedar marcado como representante de una aseguradora cuando su acuerdo
   * venció.
   */
  @ApiProperty()
  independent!: boolean;

  /** Cuántas aseguradoras representa hoy. */
  @ApiProperty()
  currentCarrierCount!: number;

  /** Alta de la fila. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

/** Listado de brokers del tenant activo. */
export class BrokerDirectoryResponseDto {
  /** Los brokers visibles. */
  @ApiProperty({ type: [BrokerSummaryDto] })
  items!: BrokerSummaryDto[];

  /** Cuántos trae la respuesta. */
  @ApiProperty()
  count!: number;
}

/**
 * Perfil del broker: lo declarado, lo verificado y con quién trabaja.
 *
 * No incluye cartera de clientes: esa es otra lectura, con otro permiso, para
 * que ver el perfil de un broker no arrastre consigo la lista de sus
 * asegurados.
 */
export class BrokerProfileDto extends BrokerSummaryDto {
  /** Vinculaciones, vigentes e históricas, en orden cronológico inverso. */
  @ApiProperty({ type: [BrokerAgreementDto] })
  agreements!: BrokerAgreementDto[];

  /**
   * Perfil público en la red social, si el broker publicó uno.
   *
   * Se sirve el identificador: el contenido del perfil lo gobierna `community`
   * con sus propias reglas de visibilidad, y duplicarlo acá sería una segunda
   * implementación del mismo concepto.
   */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  publicProfileId!: string | null;
}

/**
 * Una relación broker–cliente de la cartera.
 *
 * **Sólo la relación comercial.** Se sirve el identificador del perfil del
 * paciente y nada de su historia clínica: la especificación prohíbe
 * expresamente que el broker acceda al historial médico, y la forma de
 * garantizarlo es que esta lectura no tenga por dónde traerlo.
 */
export class BrokerClientDto {
  /** Identificador de la relación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil del asegurado. Referencia, no expediente. */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  patientProfileId!: string | null;

  /** Empresa afiliada, cuando el cliente entra por un colectivo. */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  employerGroupId!: string | null;

  /** Tipo de cliente. */
  @ApiProperty({ type: InsuranceConceptDto })
  clientType!: InsuranceConceptDto;

  /** Usuario del broker que lo atiende. */
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  assignedBrokerUserId!: string | null;

  /** Inicio de la relación. */
  @ApiProperty({ nullable: true, type: String })
  effectiveFrom!: string | null;

  /** Fin de la relación. */
  @ApiProperty({ nullable: true, type: String })
  effectiveTo!: string | null;

  /** Estado de la relación. */
  @ApiProperty({ type: InsuranceConceptDto })
  status!: InsuranceConceptDto;
}

/** Cartera de un broker. */
export class BrokerPortfolioResponseDto {
  /** Las relaciones de la cartera. */
  @ApiProperty({ type: [BrokerClientDto] })
  items!: BrokerClientDto[];

  /** Cuántas trae la respuesta. */
  @ApiProperty()
  count!: number;
}
