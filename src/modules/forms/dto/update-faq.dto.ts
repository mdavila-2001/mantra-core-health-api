import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsPlainText } from '../../../common/validators/plain-text.validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';

/** Body of `PATCH /forms/faqs/:id`: only what changed. */
export class UpdateFaqDto {
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(300)
  @IsPlainText()
  question?: string;

  @ApiPropertyOptional({ maxLength: 3000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(4000)
  @IsPlainText()
  answer?: string;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsPlainText()
  category?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrictBoolean()
  isPublished?: boolean;
}
