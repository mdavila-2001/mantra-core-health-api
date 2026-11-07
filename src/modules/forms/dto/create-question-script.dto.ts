import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsPlainText } from '../../../common/validators/plain-text.validator';
import { QuestionScriptItemInputDto } from './question-script-item.dto';

/** Maximum number of questions a script holds. */
export const QUESTION_SCRIPT_MAX_ITEMS = 100;

/** Body of `POST /forms/question-scripts`. Items keep the order received. */
export class CreateQuestionScriptDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(160)
  @IsPlainText()
  title!: string;

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

  @ApiProperty({
    type: [QuestionScriptItemInputDto],
    minItems: 1,
    maxItems: QUESTION_SCRIPT_MAX_ITEMS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUESTION_SCRIPT_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => QuestionScriptItemInputDto)
  items!: QuestionScriptItemInputDto[];
}
