import { ApiProperty } from '@nestjs/swagger';
import { QUESTION_ANSWER_TYPES } from './question-script-item.dto';

/** One question of a stored script. */
export class QuestionScriptItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: '1-based order inside the script' })
  position!: number;
  @ApiProperty() questionText!: string;
  @ApiProperty({ type: String, nullable: true }) helpText!: string | null;
  @ApiProperty({ enum: QUESTION_ANSWER_TYPES }) answerType!: string;
  @ApiProperty({ type: [String], nullable: true }) options!: string[] | null;
  @ApiProperty() required!: boolean;
}

/** A full script, with its questions in order. */
export class QuestionScriptDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) specialtyCode!: string | null;
  @ApiProperty({ enum: ['active', 'archived'] }) status!: string;
  @ApiProperty({ description: 'Optimistic-concurrency token for PATCH' })
  version!: number;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty({ type: [QuestionScriptItemDto] })
  items!: QuestionScriptItemDto[];
}

/** One row of the practitioner's script list. */
export class QuestionScriptSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) specialtyCode!: string | null;
  @ApiProperty({ enum: ['active'] }) status!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

/** `GET /forms/question-scripts`: the practitioner's active scripts. */
export class QuestionScriptListResponseDto {
  @ApiProperty({ type: [QuestionScriptSummaryDto] })
  items!: QuestionScriptSummaryDto[];
}
