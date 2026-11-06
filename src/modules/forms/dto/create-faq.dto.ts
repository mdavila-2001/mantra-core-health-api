import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsPlainText } from '../../../common/validators/plain-text.validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';

/** Body of `POST /forms/faqs`. The entry goes after the last one. */
export class CreateFaqDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(300)
  @IsPlainText()
  question!: string;

  @ApiProperty({ maxLength: 3000 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '$property must not be blank' })
  @MaxLength(4000)
  @IsPlainText()
  answer!: string;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsPlainText()
  category?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsStrictBoolean()
  isPublished?: boolean;
}
