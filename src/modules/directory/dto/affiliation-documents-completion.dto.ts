import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /tenants/{tenantId}/affiliation-documents` (P50).
 *
 * Los papeles que el alta pública dejó opcionales (decisión D2) y que una
 * farmacia necesita para operar: cada campo es el `fileId` de un PDF ya subido
 * con `POST /iam/auth/upload-registration-document`. Todos opcionales; el
 * servicio exige al menos uno (422) y rechaza el que ya está presentado (409).
 * Los nombres son los mismos que `organization.legalDocuments` del alta, más
 * el poder del representante, que en el alta viaja en `legalRepresentative`.
 */
export class CompleteAffiliationDocumentsDto {
  /** Escritura de constitución. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  constitutionFileId?: string;

  /** Identificación tributaria (NIT). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  taxIdentifierFileId?: string;

  /** Registro mercantil (SEPREC). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  commerceRegistryFileId?: string;

  /** Licencia de funcionamiento. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  operatingLicenseFileId?: string;

  /** Certificado de la autoridad sanitaria (SEDES). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthAuthorityCertificateFileId?: string;

  /** Poder notariado del representante legal declarado en el alta. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  powerOfAttorneyFileId?: string;

  /** Número de la identificación tributaria; acompaña a `taxIdentifierFileId`. */
  @ApiPropertyOptional({ maxLength: 50, example: '1023456029' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  taxIdentifier?: string;
}

/** Resultado de completar papeles. */
export class CompleteAffiliationDocumentsResponseDto {
  /** Cuántos documentos quedaron registrados, pendientes de verificación. */
  @ApiProperty({ example: 2 })
  registered!: number;

  /** Ids de las filas de `tenant_affiliation_documents` creadas. */
  @ApiProperty({ type: [String], format: 'uuid' })
  documentIds!: string[];
}

/** Lo que una farmacia necesita para operar y todavía le falta (P50). */
export class PharmacyReadinessResponseDto {
  /** `true` si la plataforma ya puede verificarla. */
  @ApiProperty()
  ready!: boolean;

  /**
   * Lo que falta: roles de documento (`CONSTITUTION_DOC`, `TAX_IDENTIFIER_DOC`,
   * `COMMERCE_REGISTRY_DOC`, `OPERATING_LICENSE_DOC`,
   * `HEALTH_AUTHORITY_CERT_DOC`, `POWER_OF_ATTORNEY_DOC`), `PHARMACY_RECORD` o
   * `HEADQUARTERS_LOCATION`.
   */
  @ApiProperty({
    type: [String],
    enum: [
      'CONSTITUTION_DOC',
      'TAX_IDENTIFIER_DOC',
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
      'POWER_OF_ATTORNEY_DOC',
      'PHARMACY_RECORD',
      'HEADQUARTERS_LOCATION',
    ],
  })
  missing!: string[];
}

/**
 * Lo que le falta a un laboratorio para operar (P51): los roles de documento
 * `COMMERCE_REGISTRY_DOC` (SEPREC), `OPERATING_LICENSE_DOC` y
 * `HEALTH_AUTHORITY_CERT_DOC` (SEDES) que todavía no presentó.
 */
export class LaboratoryReadinessResponseDto {
  /** `true` si la plataforma ya puede verificarlo. */
  @ApiProperty()
  ready!: boolean;

  /** Los papeles que faltan, en orden estable. */
  @ApiProperty({
    type: [String],
    enum: [
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
    ],
  })
  missing!: string[];
}
