import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  CARE_RELATIONSHIP_DECISIONS,
  type CareRelationshipDecision,
} from './respond-care-relationship.dto';

/**
 * Body of `POST /authz/practitioners/me/care-relationships/:id/respond`: the
 * practitioner accepts or rejects a primary-care request a patient made.
 */
export class RespondPrimaryCareRequestDto {
  /** Practitioner's decision. */
  @ApiProperty({
    description: 'Decisión sobre la solicitud de cabecera',
    enum: CARE_RELATIONSHIP_DECISIONS,
  })
  @IsIn(CARE_RELATIONSHIP_DECISIONS)
  decision!: CareRelationshipDecision;
}
