import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  registerDecorator,
  type ValidationArguments,
} from 'class-validator';
import { IsPlainText } from '../../../common/validators/plain-text.validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';

/** Answer types a script question accepts. */
export const QUESTION_ANSWER_TYPES = [
  'free_text',
  'yes_no',
  'single_choice',
  'multiple_choice',
  'number',
  'date',
] as const;
export type QuestionAnswerType = (typeof QUESTION_ANSWER_TYPES)[number];

/** Answer types whose question must carry its own list of options. */
export const CHOICE_ANSWER_TYPES: readonly string[] = [
  'single_choice',
  'multiple_choice',
];

/**
 * `options` is mandatory for choice questions (≥ 2 non-blank, distinct after
 * trimming, case-insensitive) and forbidden for every other answer type.
 */
function IsOptionsForAnswerType(): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isOptionsForAnswerType',
      target: object.constructor,
      propertyName: String(propertyName),
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const answerType = (args.object as { answerType?: unknown })
            .answerType;
          if (!CHOICE_ANSWER_TYPES.includes(answerType as string)) {
            return value === undefined || value === null;
          }
          if (!Array.isArray(value) || value.length < 2) return false;
          if (value.some((o) => typeof o !== 'string' || !o.trim()))
            return false;
          const keys = value.map((o: string) => o.trim().toLowerCase());
          return new Set(keys).size === keys.length;
        },
        defaultMessage() {
          return 'options requires ≥ 2 non-blank, distinct strings for single_choice/multiple_choice and must be absent for any other answerType';
        },
      },
    });
  };
}

/** One question of a script, as the client sends it. */
export class QuestionScriptItemInputDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(500)
  @IsPlainText()
  questionText!: string;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @IsPlainText()
  helpText?: string | null;

  @ApiProperty({ enum: QUESTION_ANSWER_TYPES })
  @IsIn(QUESTION_ANSWER_TYPES)
  answerType!: QuestionAnswerType;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description:
      'Required (≥ 2 distinct, non-blank) for single_choice/multiple_choice; forbidden otherwise',
  })
  @IsOptionsForAnswerType()
  options?: string[] | null;

  @ApiProperty()
  @IsStrictBoolean()
  required!: boolean;
}
