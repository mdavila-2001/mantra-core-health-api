import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Tipos de cuenta soportados por el plan contable de este módulo. */
export type AccountType =
  'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
/** Saldo normal (débito o crédito). */
export type NormalBalance = 'DEBIT' | 'CREDIT';

/** Cuerpo de `POST /accounting/accounts` (soporte del plan de cuentas). */
export class CreateAccountDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica propietaria', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código contable', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la cuenta', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de account type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @IsIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
  accountType!: AccountType;

  /**
   * Valor de normal balance mantenido por la instancia.
   */
  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsIn(['DEBIT', 'CREDIT'])
  normalBalance!: NormalBalance;

  /**
   * Valor de is postable mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: '¿La cuenta admite posteos directos?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPostable?: boolean;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Respuesta con la cuenta creada. */
export class AccountResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty() name!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de is postable mantenido por la instancia.
   */
  @ApiProperty() isPostable!: boolean;
}
