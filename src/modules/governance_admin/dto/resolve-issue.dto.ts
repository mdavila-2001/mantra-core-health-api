import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const RESOLUTION_ACTIONS = ['RESOLVE', 'DISMISS'] as const;
export type ResolutionAction = (typeof RESOLUTION_ACTIONS)[number];

export class ResolveIssueDto {
  @ApiProperty({ enum: RESOLUTION_ACTIONS })
  @IsIn(RESOLUTION_ACTIONS)
  action!: ResolutionAction;

  @ApiProperty({
    description: 'Motivo de la resolución o del descarte. Es obligatorio y queda en la incidencia.',
    minLength: 10,
    maxLength: 2000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  note!: string;
}
