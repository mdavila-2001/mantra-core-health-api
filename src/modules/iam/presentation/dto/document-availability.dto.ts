import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import type { DocumentHolderKind } from '../../application/services/document-uniqueness';

/**
 * Consulta de `GET /iam/auth/document-availability` (C-10 / MD-01), con los
 * nombres del contrato publicado: `type`, `number`, `issuer`, `userType`.
 *
 * Las mismas reglas de forma que el documento del alta, para que la consulta
 * no acepte nada que el alta rechazaría.
 */
export class DocumentAvailabilityQueryDto {
  /** Hoy el único documento con unicidad es la cédula; el campo deja lugar a otros. */
  @ApiPropertyOptional({ enum: ['NATIONAL_ID'], default: 'NATIONAL_ID' })
  @IsOptional()
  @IsIn(['NATIONAL_ID'])
  type?: 'NATIONAL_ID';

  @ApiProperty({ description: 'Número del documento de identidad' })
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  number!: string;

  /** Obligatorio, como en el alta: la regla es número + departamento. */
  @ApiProperty({
    format: 'uuid',
    description: 'Departamento emisor del documento (VS_BO_DEPARTMENT)',
  })
  @IsUUID()
  issuer!: string;

  @ApiProperty({ enum: ['PATIENT', 'PRACTITIONER'] })
  @IsIn(['PATIENT', 'PRACTITIONER'])
  userType!: DocumentHolderKind;
}

/** Sólo si está libre: nunca a quién pertenece. */
export class DocumentAvailabilityResponseDto {
  @ApiProperty()
  available!: boolean;
}
