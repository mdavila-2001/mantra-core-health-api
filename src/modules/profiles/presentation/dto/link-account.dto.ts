import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/persons/{personId}/account-links` (UC-05-02). */
export class LinkAccountDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({
    description: 'Usuario IAM a vincular con la persona',
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;

  /**
   * Identificador asociado a link type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de vínculo (por defecto: self)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  linkTypeConceptId?: string;
}

/** Respuesta de vinculación de cuenta. */
export class AccountLinkResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del vínculo',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;
}
