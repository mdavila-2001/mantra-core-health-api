import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceConceptDto } from './read.dto';

/**
 * Filtros y paginación del listado de solicitudes.
 *
 * El cursor es **opaco**: sale de `encodeKeysetCursor` y se reenvía tal cual.
 * No se ofrece número de página ni total de filas a propósito — el listado se
 * recorre por keyset sobre `(submitted_at, id)`, y un `COUNT(*)` sobre una
 * tabla que crece con cada atención es la consulta que primero se vuelve cara.
 */
export class ClaimListQueryDto {
  /** Estado de la solicitud, por id de concepto. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  /** Aseguradora a la que se presentó. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  insuranceCarrierId?: string;

  /** Desde (inclusive) sobre `submitted_at`, en ISO 8601. */
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  submittedFrom?: string;

  /** Hasta (inclusive) sobre `submitted_at`, en ISO 8601. */
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  submittedTo?: string;

  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  /** Tamaño de página. */
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Un importe con su moneda.
 *
 * El monto viaja como **cadena decimal**, no como `number`: `numeric` de
 * Postgres no entra en un doble sin perder centavos, y el total de la pantalla
 * tiene que coincidir con el de la fila carácter por carácter (AC-16-6). La
 * moneda viaja al lado porque un importe sin moneda no se puede pintar sin
 * inventarle un símbolo.
 */
export class MoneyDto {
  /** Importe como cadena decimal, tal cual lo devuelve la base. */
  @ApiProperty({ example: '1250.00' })
  amount!: string;

  /** Moneda del importe, resuelta a su par legible. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  currency!: InsuranceConceptDto | null;
}

/**
 * El paciente de una solicitud, con lo mínimo para nombrarlo.
 *
 * **Va declarado antes de `ClaimListItemDto`, y el orden no es estético.** La
 * anotación de tipo de una propiedad decorada se emite como metadato
 * `design:type` y se evalúa **al decorar**, no al usarse: con esta clase
 * declarada más abajo, cargar el módulo revienta con `Cannot access
 * 'ClaimPatientDto' before initialization` y la API no arranca. El `type: () =>`
 * perezoso del decorador no alcanza — el que evalúa temprano es el metadato.
 */
export class ClaimPatientDto {
  /** Identificador de la persona. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Nombre visible.
   *
   * `null` si la persona no tiene `display_name`: se muestra el código de
   * paciente y no un uuid, que no le dice nada a nadie.
   */
  @ApiProperty({ nullable: true, type: String })
  displayName!: string | null;

  /** Código de paciente dentro de la plataforma. */
  @ApiProperty({ nullable: true, type: String })
  patientCode!: string | null;

  /** Identificador de afiliado dentro de la póliza. */
  @ApiProperty({ nullable: true, type: String })
  memberIdentifier!: string | null;
}

/**
 * Una fila del listado de solicitudes.
 *
 * **Dos columnas del pedido no están acá, y no es un olvido.** «Broker
 * responsable de la solicitud» y «medio (automático/manual)» no tienen columna
 * en `insurance_claims`; se declaran como pendientes de esquema en la ficha
 * TAREA-16 §5.2. Lo que sí existe es el corredor de la **póliza**
 * (`patient_coverages.insurance_broker_id`), que responde «quién atiende hoy a
 * este paciente» y **no** «quién presentó esta solicitud»: viaja como
 * `policyBroker` con ese nombre, para que la pantalla no lo rotule como algo
 * que no es.
 */
export class ClaimListItemDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Número de solicitud ante la aseguradora. */
  @ApiProperty({ example: 'CLM-2026-000123' })
  claimIdentifier!: string;

  /** Paciente asegurado. */
  @ApiProperty({ type: ClaimPatientDto })
  patient!: ClaimPatientDto;

  /** La aseguradora a la que se presentó. */
  @ApiProperty({ example: 'La Boliviana Ciacruz' })
  carrierName!: string;

  /** Identificador de la aseguradora. */
  @ApiProperty({ format: 'uuid' })
  insuranceCarrierId!: string;

  /** Póliza concreta bajo la que se presentó. */
  @ApiProperty({ nullable: true, type: String, example: 'POL-88213' })
  policyIdentifier!: string | null;

  /**
   * Corredor de la póliza del paciente.
   *
   * No es el «broker responsable de la solicitud» del pedido: ese dato no
   * tiene dónde guardarse todavía. Ver el JSDoc de la clase.
   */
  @ApiProperty({ nullable: true, type: String })
  policyBrokerName!: string | null;

  /** Monto solicitado. */
  @ApiProperty({ type: MoneyDto })
  billedTotal!: MoneyDto;

  /**
   * Total aprobado por la última adjudicación no superada.
   *
   * `null` mientras no haya dictamen. **No es `0`**: una solicitud sin
   * respuesta y una denegada por completo son cosas distintas y confundirlas
   * es un error contable.
   */
  @ApiProperty({ nullable: true, type: MoneyDto })
  approvedTotal!: MoneyDto | null;

  /** Fecha de envío, si ya se envió. */
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  submittedAt!: string | null;

  /** Estado de la solicitud. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  status!: InsuranceConceptDto | null;

  /** Si tiene una disputa abierta: la solicitud está reclamada. */
  @ApiProperty({ example: false })
  hasOpenDispute!: boolean;
}

/** Página del listado de solicitudes. */
export class ClaimListResponseDto {
  /** Filas de esta página. */
  @ApiProperty({ type: [ClaimListItemDto] })
  items!: ClaimListItemDto[];

  /** Cursor de la página siguiente, o `null` si esta es la última. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/**
 * Un ítem de la solicitud, con su dictamen si lo tiene.
 *
 * El identificador clínico de origen viaja en `reference`, y **el tipo se
 * declara sólo cuando el modelo lo sabe**: hay FK a la oferta de estudio y a la
 * línea de dispensación, y nada más. Cuando el ítem se apoya en
 * `supporting_clinical_reference` —un `varchar` sin integridad referencial— se
 * devuelve el texto con `referenceType: null`, y la pantalla dice que el tipo
 * no está registrado en vez de adivinarlo (AC-16-10).
 *
 * `policyClauseReference`/`denialRationale` (subtarea 2.2) son la cita de la
 * cláusula y la justificación circunstanciada **del ítem**; `denialReason` sigue
 * siendo el motivo TIPIFICADO. Ninguna reemplaza a las otras.
 */
export class ClaimLineViewDto {
  /** Identificador del ítem. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Orden del ítem dentro de la solicitud. */
  @ApiProperty({ example: 1 })
  lineSequence!: number;

  /** Prestación facturada, resuelta a su par legible. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  service!: InsuranceConceptDto | null;

  /** Monto facturado del ítem. */
  @ApiProperty({ type: MoneyDto })
  billedAmount!: MoneyDto;

  /** Monto a cargo del paciente declarado al facturar. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  patientResponsibilityAmount!: MoneyDto | null;

  /** Monto aprobado; `null` mientras no haya dictamen para este ítem. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  approvedAmount!: MoneyDto | null;

  /** Monto denegado, si el dictamen denegó parte o todo. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  deniedAmount!: MoneyDto | null;

  /** Decisión del dictamen sobre este ítem. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  decision!: InsuranceConceptDto | null;

  /** Motivo catalogado del rechazo. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  denialReason!: InsuranceConceptDto | null;

  /**
   * Cita textual de la cláusula contractual que fundamenta el rechazo (subtarea 2.2).
   *
   * `null` mientras el ítem no tenga dictamen, o si el dictamen es anterior a v4.2.9:
   * la tabla es `<<IMMUTABLE>>` y esas filas no pueden ganar la cláusula después.
   */
  @ApiProperty({ nullable: true, type: String })
  policyClauseReference!: string | null;

  /** Justificación circunstanciada del rechazo, por ítem (subtarea 2.2). `null` en las mismas condiciones que `policyClauseReference`. */
  @ApiProperty({ nullable: true, type: String })
  denialRationale!: string | null;

  /**
   * Qué es el documento clínico de origen.
   *
   * `DIAGNOSTIC_STUDY` o `MEDICATION_DISPENSATION` cuando hay FK; `null`
   * cuando sólo hay una referencia de texto libre.
   */
  @ApiProperty({
    nullable: true,
    type: String,
    enum: ['DIAGNOSTIC_STUDY', 'MEDICATION_DISPENSATION'],
  })
  referenceType!: 'DIAGNOSTIC_STUDY' | 'MEDICATION_DISPENSATION' | null;

  /** Identificador del documento clínico de origen, si lo hay. */
  @ApiProperty({ nullable: true, type: String })
  reference!: string | null;
}

/** El dictamen vigente de una solicitud. */
export class ClaimAdjudicationDto {
  /** Identificador de la versión de adjudicación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Número de versión: cada dictamen nuevo no edita, sucede al anterior. */
  @ApiProperty({ example: 1 })
  adjudicationVersion!: number;

  /** Resultado del dictamen. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  outcome!: InsuranceConceptDto | null;

  /** Texto de la disposición, tal cual lo emitió la aseguradora. */
  @ApiProperty({ nullable: true, type: String })
  dispositionText!: string | null;

  /** Total aprobado por esta versión. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  totalApprovedAmount!: MoneyDto | null;

  /** Total a cargo del paciente según esta versión. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  totalPatientAmount!: MoneyDto | null;

  /** Total denegado por esta versión. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  totalDeniedAmount!: MoneyDto | null;

  /** Cuándo se dictaminó. */
  @ApiProperty({ type: String, format: 'date-time' })
  adjudicatedAt!: string;
}

/** Una disputa abierta sobre la solicitud. */
export class ClaimDisputeSummaryDto {
  /** Identificador de la disputa. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Tipo de disputa. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  disputeType!: InsuranceConceptDto | null;

  /** Motivo por el que se reclama. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  disputeReason!: InsuranceConceptDto | null;

  /** Estado de la disputa. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  status!: InsuranceConceptDto | null;

  /** Cuándo se presentó. */
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  submittedAt!: string | null;

  /** Fecha límite para presentarla, si la aseguradora la fijó. */
  @ApiProperty({ nullable: true, type: String, format: 'date' })
  filingDeadline!: string | null;
}

/**
 * El detalle completo de una solicitud.
 *
 * `lineBilledTotal` **no se recalcula en la pantalla**: viene sumado en el
 * servidor con aritmética decimal y se compara como cadena contra el
 * `billedTotal` de la cabecera. Si difieren, la solicitud tiene un descuadre
 * real y la pantalla tiene que poder decirlo en vez de taparlo redondeando.
 */
export class ClaimDetailDto {
  /** Cabecera: los mismos campos que la fila del listado. */
  @ApiProperty({ type: ClaimListItemDto })
  header!: ClaimListItemDto;

  /** Ítems de la solicitud, en orden de secuencia. */
  @ApiProperty({ type: [ClaimLineViewDto] })
  lines!: ClaimLineViewDto[];

  /** Suma de los montos facturados de los ítems, calculada en el servidor. */
  @ApiProperty({ type: MoneyDto })
  lineBilledTotal!: MoneyDto;

  /** Suma de los montos aprobados; `null` si ningún ítem tiene dictamen. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  lineApprovedTotal!: MoneyDto | null;

  /** Dictamen vigente, si ya lo hay. */
  @ApiProperty({ nullable: true, type: ClaimAdjudicationDto })
  adjudication!: ClaimAdjudicationDto | null;

  /** Historial de dictámenes, del más nuevo al más viejo. */
  @ApiProperty({ type: [ClaimAdjudicationDto] })
  adjudicationHistory!: ClaimAdjudicationDto[];

  /** Disputas presentadas sobre esta solicitud. */
  @ApiProperty({ type: [ClaimDisputeSummaryDto] })
  disputes!: ClaimDisputeSummaryDto[];
}
