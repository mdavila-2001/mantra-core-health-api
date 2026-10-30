import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PrescriberLicenseDto } from '../../clinical/dto/prescription-verification.dto';

/** Qué comparte un enlace: la receta de una consulta o un fármaco suelto. */
export const PRESCRIPTION_SHARE_RESOURCE_TYPES = [
  'PRESCRIPTION_ENCOUNTER',
  'MEDICATION_REQUEST',
] as const;
export type PrescriptionShareResourceType =
  (typeof PRESCRIPTION_SHARE_RESOURCE_TYPES)[number];

/** Estado del enlace al leerlo. */
export const PRESCRIPTION_SHARE_STATUSES = [
  'VALID',
  'EXPIRED',
  'REVOKED',
] as const;

/**
 * Cuerpo de `POST /clinical/prescription-shares`. Exactamente uno de los dos:
 * la regla la aplica el servicio (400 `PRESCRIPTION_SHARE_TARGET_INVALID`).
 */
export class CreatePrescriptionShareDto {
  /** Encuentro cuya receta se comparte (todos sus ítems vigentes). */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro de la receta. Excluye a `medicationRequestId`.',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /** Fármaco suelto que se comparte. */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Fármaco suelto. Excluye a `encounterId`.',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;
}

/** Query de `GET /clinical/prescription-shares`. */
export class ListPrescriptionSharesQueryDto {
  /** Paciente cuyos enlaces se listan. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;
}

/** 201 de `POST /clinical/prescription-shares`. El token sale solo acá. */
export class PrescriptionShareCreatedDto {
  @ApiProperty({ format: 'uuid' })
  shareId!: string;

  /** `${WEB_APP_BASE_URL}/rx/<token>`. */
  @ApiProperty({ description: 'Enlace para compartir: `<web>/rx/<token>`' })
  url!: string;

  /** Token en claro: no se puede volver a pedir. */
  @ApiProperty({ description: 'Token en claro; se devuelve una sola vez' })
  token!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  /** Ítems vigentes que comparte. */
  @ApiProperty()
  itemCount!: number;
}

/** Un enlace en la lista del paciente. Nunca lleva el token ni su hash. */
export class PrescriptionShareSummaryDto {
  @ApiProperty({ format: 'uuid' })
  shareId!: string;

  @ApiProperty({ enum: PRESCRIPTION_SHARE_RESOURCE_TYPES })
  resourceType!: PrescriptionShareResourceType;

  /** Encuentro o fármaco compartido. */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ enum: PRESCRIPTION_SHARE_STATUSES })
  status!: 'VALID' | 'EXPIRED' | 'REVOKED';

  /** Aperturas `OPENED` por una farmacia. */
  @ApiProperty()
  uses!: number;
}

/** 200 de `GET /clinical/prescription-shares/by-token/:token` (D-1). */
export class PrescriptionShareOwnershipDto {
  @ApiProperty({ format: 'uuid' })
  shareId!: string;

  @ApiProperty({ enum: PRESCRIPTION_SHARE_RESOURCE_TYPES })
  resourceType!: PrescriptionShareResourceType;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;
}

/**
 * 200 de `GET /public/prescription-shares/:token` (S-4, D-2). Quién la emitió
 * y cuándo: **nada del paciente ni de los fármacos**.
 */
export class PublicPrescriptionShareDto {
  @ApiProperty({ enum: PRESCRIPTION_SHARE_STATUSES })
  status!: 'VALID' | 'EXPIRED' | 'REVOKED';

  /** Emisión más antigua de los ítems compartidos. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  issuedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  prescriberName!: string | null;

  @ApiPropertyOptional({ type: PrescriberLicenseDto, nullable: true })
  prescriberLicense!: PrescriberLicenseDto | null;

  /** Ítems vigentes de la receta al momento de la consulta. */
  @ApiProperty()
  itemCount!: number;
}
