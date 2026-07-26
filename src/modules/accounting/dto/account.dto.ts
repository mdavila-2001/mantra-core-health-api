import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Tipos de cuenta soportados por el plan contable de este módulo. */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
/** Saldo normal (débito o crédito). */
export type NormalBalance = 'DEBIT' | 'CREDIT';

/** Cuerpo de `POST /accounting/accounts` (soporte del plan de cuentas). */
export class CreateAccountDto {
  @ApiProperty({ description: 'Práctica propietaria', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Código contable', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ description: 'Nombre de la cuenta', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @IsIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
  accountType!: AccountType;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsIn(['DEBIT', 'CREDIT'])
  normalBalance!: NormalBalance;

  @ApiPropertyOptional({ description: '¿La cuenta admite posteos directos?', default: true })
  @IsOptional()
  @IsBoolean()
  isPostable?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Respuesta con la cuenta creada. */
export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() status!: string;
  @ApiProperty() isPostable!: boolean;
}
