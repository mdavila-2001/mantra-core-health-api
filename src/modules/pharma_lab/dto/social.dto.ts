import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Propuesta de publicación individual de un visitador (UC-17-35).
 *
 * La publicación no existe hasta que la organización la aprueba (spec 5566): el
 * visitador propone, el laboratorio decide y solo entonces se crea la
 * publicación en la red social.
 */
export class SubmitVisitorPostDto {
  /**
   * Cuerpo de la publicación propuesta.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  body!: string;

  /**
   * Material científico aprobado que la acompaña.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  informationalMaterialId?: string;
}

/** Decisión de la organización sobre la publicación propuesta (UC-17-36). */
export class DecideVisitorPostDto {
  /**
   * Decisión: aprobada o rechazada.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  statusConceptId!: string;

  /**
   * Fundamento de la decisión.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  rationale!: string;
}
