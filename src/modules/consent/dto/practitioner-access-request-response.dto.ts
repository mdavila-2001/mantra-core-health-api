import { ApiProperty } from '@nestjs/swagger';

/** Una solicitud de vínculo médico-paciente, tal como la ve cada lado. */
export class PractitionerAccessRequestResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Id del consent que representa la solicitud',
  })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Profesional que pidió el acceso',
  })
  requestedByUserId!: string;

  @ApiProperty({ description: 'Estado actual (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({
    description: 'Especialidades pedidas (concept ids)',
    type: [String],
  })
  requestedSpecialtyConceptIds!: string[];

  @ApiProperty({
    description:
      'Especialidades ya autorizadas por el paciente (vacío si aún no decidió)',
    type: [String],
  })
  authorizedSpecialtyConceptIds!: string[];

  @ApiProperty({ required: false, nullable: true })
  reasonText!: string | null;

  @ApiProperty()
  requestedAt!: Date;
}
