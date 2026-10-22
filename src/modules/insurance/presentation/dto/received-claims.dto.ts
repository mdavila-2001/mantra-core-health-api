import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ClaimPatientDto, MoneyDto } from './claims-read.dto';
import { InsuranceConceptDto } from './read.dto';

/** Importe no negativo con hasta dos decimales, como lo manda el cliente. */
const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

/** Cómo puede decidir la aseguradora una solicitud recibida. */
export const RECEIVED_CLAIM_OUTCOMES = [
  'APPROVED',
  'PARTIAL',
  'REJECTED',
] as const;

/** Una de {@link RECEIVED_CLAIM_OUTCOMES}. */
export type ReceivedClaimOutcome = (typeof RECEIVED_CLAIM_OUTCOMES)[number];

/**
 * Cuerpo de `POST /insurance/received-claims/:id/decision`.
 *
 * Lo que la forma no puede expresar —`approvedAmount` sólo en `PARTIAL`,
 * menor que lo solicitado; `reason` de al menos cinco caracteres al rechazar o
 * aprobar en parte— lo valida el servicio y responde 422, que es lo que la
 * pantalla espeja.
 */
export class ReceivedClaimDecisionDto {
  /** Aprobar todo, aprobar una parte, o rechazar. Es definitivo. */
  @ApiProperty({ enum: RECEIVED_CLAIM_OUTCOMES })
  @IsIn(RECEIVED_CLAIM_OUTCOMES)
  outcome!: ReceivedClaimOutcome;

  /**
   * Monto aprobado, cadena decimal. Sólo en `PARTIAL`: mayor que cero y menor
   * que lo solicitado. En `APPROVED` el monto es el solicitado y en
   * `REJECTED`, cero, así que mandarlo ahí es un error (422).
   */
  @ApiPropertyOptional({ example: '200.00' })
  @IsOptional()
  @IsNumberString()
  @Matches(MONEY_PATTERN, {
    message: 'approvedAmount debe ser no negativo y tener hasta dos decimales',
  })
  approvedAmount?: string;

  /** Obligatorio (mínimo 5 caracteres) en `REJECTED` y `PARTIAL`; opcional en `APPROVED`. */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  /**
   * Cláusula del contrato que sustenta lo que no se aprueba.
   *
   * Opcional, y es una **extensión aditiva** del contrato de la pantalla: sin
   * ella la solicitud igual se dictamina, pero la liquidación del prestador
   * queda «en revisión» —la regla de transparencia de exclusiones exige cláusula
   * en toda línea no aprobada—. Se aplica a las líneas con importe denegado.
   */
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  policyClauseReference?: string;
}

/** El profesional que prestó el servicio. */
export class ReceivedClaimPractitionerDto {
  /** Perfil del profesional. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Nombre visible. */
  @ApiProperty()
  displayName!: string;

  /** Especialidad principal, como la muestra el directorio. */
  @ApiProperty({ nullable: true, type: String })
  specialty!: string | null;
}

/** Un renglón de la solicitud. */
export class ReceivedClaimLineDto {
  /** Posición del renglón en la solicitud. */
  @ApiProperty()
  sequence!: number;

  /** Código del catálogo de servicios; vacío si el renglón no tiene servicio catalogado. */
  @ApiProperty()
  code!: string;

  /** Nombre del servicio. */
  @ApiProperty()
  display!: string;

  /** Cantidad facturada. */
  @ApiProperty()
  quantity!: number;

  /** Precio unitario: lo facturado dividido la cantidad. */
  @ApiProperty({ type: MoneyDto })
  unitPrice!: MoneyDto;

  /** Importe facturado del renglón. */
  @ApiProperty({ type: MoneyDto })
  billedAmount!: MoneyDto;
}

/** Qué decidió la aseguradora. */
export class ReceivedClaimDecisionViewDto {
  /** Resultado del dictamen. */
  @ApiProperty({ enum: RECEIVED_CLAIM_OUTCOMES })
  outcome!: ReceivedClaimOutcome;

  /** Cuándo se dictaminó. */
  @ApiProperty({ format: 'date-time' })
  decidedAt!: string;

  /** Quién dictaminó, por nombre. */
  @ApiProperty()
  decidedBy!: string;

  /** Motivo del dictamen; `null` si no se dio. */
  @ApiProperty({ nullable: true, type: String })
  reason!: string | null;
}

/**
 * Una solicitud recibida por la aseguradora, lista para la tabla.
 *
 * La cara de **quien paga** del mismo `insurance_claims` que el prestador ve en
 * «Solicitudes de seguro». Todo sale de columnas que el modelo ya declara.
 */
export class ReceivedClaimDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Número de solicitud ante la aseguradora. */
  @ApiProperty({ example: 'CLM-2026-1042' })
  claimIdentifier!: string;

  /** El paciente, con lo mínimo para nombrarlo. */
  @ApiProperty({ type: ClaimPatientDto })
  patient!: ClaimPatientDto;

  /** El profesional de la atención; `null` si la solicitud no nace de una atención. */
  @ApiProperty({ nullable: true, type: ReceivedClaimPractitionerDto })
  practitioner!: ReceivedClaimPractitionerDto | null;

  /** Quien factura: el consultorio o la unidad diagnóstica. */
  @ApiProperty()
  providerName!: string;

  /** El servicio de mayor importe de la solicitud. */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  service!: InsuranceConceptDto | null;

  /** Cuántos servicios más trae la solicitud, además de `service`. */
  @ApiProperty()
  additionalServiceCount!: number;

  /** Total solicitado. */
  @ApiProperty({ type: MoneyDto })
  billedTotal!: MoneyDto;

  /** Total aprobado; `null` mientras no haya dictamen. No es cero. */
  @ApiProperty({ nullable: true, type: MoneyDto })
  approvedTotal!: MoneyDto | null;

  /** Cuándo se envió. */
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  submittedAt!: string | null;

  /** Día de la atención: es una fecha, no un instante. */
  @ApiProperty({ nullable: true, type: String, format: 'date' })
  serviceDate!: string | null;

  /** Póliza del afiliado. */
  @ApiProperty({ nullable: true, type: String })
  policyIdentifier!: string | null;

  /** Plan de la cobertura. */
  @ApiProperty({ nullable: true, type: String })
  planName!: string | null;

  /**
   * Estado para la pantalla: `SUBMITTED`, `APPROVED`, `PARTIAL`, `REJECTED`,
   * `PAID` o `REVERSED`. Es **derivado**: el estado de la solicitud sólo
   * distingue enviada, adjudicada, pagada y revertida, y el resultado del
   * dictamen decide cuál de las tres adjudicaciones es.
   */
  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  status!: InsuranceConceptDto | null;

  /** Los renglones, de mayor a menor importe: `service` es el primero. */
  @ApiProperty({ type: [ReceivedClaimLineDto] })
  lines!: ReceivedClaimLineDto[];

  /** El dictamen vigente; `null` mientras la solicitud sigue abierta. */
  @ApiProperty({ nullable: true, type: ReceivedClaimDecisionViewDto })
  decision!: ReceivedClaimDecisionViewDto | null;

  /**
   * La factura que produjo el dictamen favorable. **Siempre `null` por ahora**:
   * el modelo no declara dónde vive la factura del prestador a la aseguradora
   * (decisión pendiente). El dictamen favorable publica el evento
   * `InsuranceClaimDecided`, que es lo que la facturación consumirá.
   */
  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description:
      'Siempre null hasta que se decida dónde persiste la factura de la aseguradora',
  })
  invoice!: null;
}

/** Las solicitudes recibidas, con el aviso de recorte. */
export class ReceivedClaimListDto {
  /** De la más reciente a la más vieja. */
  @ApiProperty({ type: [ReceivedClaimDto] })
  items!: ReceivedClaimDto[];

  /** `true` si había más solicitudes que el tope y se recortó. */
  @ApiProperty()
  truncated!: boolean;
}
