import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  CARE_RELATIONSHIP_TYPES,
  type CareRelationshipType,
} from './create-care-relationship.dto';

/**
 * Cuerpo de `POST /authz/care-relationships/request` (FT-07-R05).
 *
 * A diferencia de `POST /authz/care-relationships` (que un `CLINICIAN`/
 * `SECURITY_ADMIN` usa para dar de alta una relación ya vigente), esta ruta la
 * dispara un practicante que encontró al paciente por búsqueda y necesita su
 * consentimiento antes de tener acceso: crea la relación en `PENDING` y no
 * concede ningún acceso hasta que el paciente responda con
 * `POST /authz/care-relationships/:id/respond`.
 */
export class RequestCareRelationshipDto {
  /** Tenant en el que se solicita la relación. */
  @ApiProperty({ description: 'Tenant de la solicitud', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /** Paciente encontrado por búsqueda al que se le pide autorización. */
  @ApiProperty({ description: 'Perfil del paciente', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /** Tipo de relación solicitada (por defecto TREATING). */
  @ApiPropertyOptional({
    description: 'Tipo de relación solicitada',
    enum: CARE_RELATIONSHIP_TYPES,
  })
  @IsOptional()
  @IsIn(CARE_RELATIONSHIP_TYPES)
  relationshipType?: CareRelationshipType;

  /** Motivo que el paciente ve en la notificación de la solicitud. */
  @ApiPropertyOptional({ description: 'Motivo de la solicitud' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonText?: string;
}
