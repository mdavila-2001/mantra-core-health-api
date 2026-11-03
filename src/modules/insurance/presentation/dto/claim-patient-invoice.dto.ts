import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/** Importe decimal con hasta dos posiciones, sin signo. */
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Factura al paciente de un servicio reclamado a la aseguradora (carril 16,
 * REQ-16-028 y 029).
 *
 * El cliente **no manda el monto**: el servidor arma la línea con la parte del
 * paciente que calculó al enviar el reclamo. `patientAmount` existe sólo como
 * confirmación de lo que la pantalla le mostró a la persona; si no coincide
 * con el cálculo, la respuesta es 422 y no se factura nada.
 */
export class IssuePatientInvoiceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Línea del reclamo que se le factura al paciente',
  })
  @IsUUID()
  claimLineId!: string;

  @ApiPropertyOptional({
    example: '140.00',
    description:
      'Confirmación del importe mostrado. Nunca se usa como monto: si difiere del cálculo del servidor, 422.',
  })
  @IsOptional()
  @Matches(MONEY_PATTERN, {
    message: 'patientAmount debe ser un importe con hasta dos decimales',
  })
  patientAmount?: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Texto de la línea de factura; por defecto lo arma el servidor.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

/** Cómo se cobró: la parte del paciente con seguro, o el total como particular. */
export const PATIENT_CHARGE_KINDS = ['INSURED_SHARE', 'PRIVATE_FULL'] as const;

/** Factura emitida y su desglose (REQ-16-031: el mismo cálculo del servidor). */
export class PatientInvoiceIssuedDto {
  @ApiProperty({ format: 'uuid' })
  invoiceId!: string;

  @ApiProperty({ format: 'uuid' })
  invoiceLineId!: string;

  @ApiProperty({ example: 'INV-1761300000000-1a2b3c4d' })
  invoiceNumber!: string;

  @ApiProperty({ format: 'uuid' })
  claimId!: string;

  @ApiProperty({ format: 'uuid' })
  claimLineId!: string;

  @ApiProperty({ enum: PATIENT_CHARGE_KINDS })
  chargeKind!: string;

  @ApiProperty({ example: '500.00' })
  billedAmount!: string;

  @ApiPropertyOptional({ example: '80', nullable: true })
  coveragePercent!: string | null;

  @ApiPropertyOptional({ example: '50.00', nullable: true })
  copayAmount!: string | null;

  @ApiProperty({ example: '140.00', description: 'Lo que paga el paciente' })
  patientAmount!: string;

  @ApiProperty({ example: '360.00', description: 'Lo que paga la aseguradora' })
  insurerAmount!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;
}
