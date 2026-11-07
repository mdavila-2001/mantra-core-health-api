import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsPlainText } from '../../../common/validators/plain-text.validator';
import { QuestionScriptItemInputDto } from './question-script-item.dto';
import { QUESTION_SCRIPT_MAX_ITEMS } from './create-question-script.dto';

/**
 * Body of `PATCH /forms/question-scripts/:id`. Every field is optional except
 * `version`, the optimistic-concurrency token read from the last GET; a stale
 * one is a 409. `items`, when sent, replaces the whole list in the order given.
 */
export class UpdateQuestionScriptDto {
  @ApiProperty({ minimum: 1, description: 'Version the client last read' })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(160)
  @IsPlainText()
  title?: string;

  @ApiPropertyOptional({ maxLength: 1600, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsPlainText()
  description?: string | null;

  @ApiPropertyOptional({ maxLength: 64, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string | null;

  @ApiPropertyOptional({
    type: [QuestionScriptItemInputDto],
    minItems: 1,
    maxItems: QUESTION_SCRIPT_MAX_ITEMS,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUESTION_SCRIPT_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => QuestionScriptItemInputDto)
  items?: QuestionScriptItemInputDto[];
}
