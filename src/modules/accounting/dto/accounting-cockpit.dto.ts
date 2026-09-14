import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Query de las lecturas del cockpit que sólo piden la práctica. */
export class CockpitPracticeQueryDto {
  /** Práctica cuyo tablero se consulta. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}

/** Query de `GET /accounting/open-items`. */
export class CockpitOpenItemsQueryDto {
  /** Práctica cuya cartera se consulta. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /** Filtra por lado de la cartera (por cobrar / por pagar). */
  @ApiProperty({
    required: false,
    enum: ['RECEIVABLE', 'PAYABLE'],
    description: 'Lado de la cartera a listar; sin filtro, ambos',
  })
  @IsOptional()
  @IsIn(['RECEIVABLE', 'PAYABLE'])
  side?: 'RECEIVABLE' | 'PAYABLE';
}

/** Un período del ejercicio fiscal del cockpit. */
export class CockpitFiscalPeriodDto {
  /** Identificador del período. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Posición 1-based del período dentro del ejercicio. */
  @ApiProperty({ example: 1 }) periodNumber!: number;
  /** Rótulo del período (hoy, el `code`). */
  @ApiProperty() name!: string;
  /** Fecha de inicio del período. */
  @ApiProperty({ format: 'date' }) startsOn!: string;
  /** Fecha de fin del período. */
  @ApiProperty({ format: 'date' }) endsOn!: string;
  /** Estado del período, derivado del concepto. */
  @ApiProperty({ enum: ['CLOSED', 'OPEN', 'PLANNED'] })
  status!: 'CLOSED' | 'OPEN' | 'PLANNED';
}

/** Respuesta de `GET /accounting/fiscal-years`: el ejercicio vigente. */
export class CockpitFiscalYearDto {
  /** Identificador del ejercicio fiscal. */
  @ApiProperty({ format: 'uuid' }) fiscalYearId!: string;
  /** Rótulo del ejercicio (hoy, el `code`: no hay columna `name`). */
  @ApiProperty() name!: string;
  /** Fecha de inicio del ejercicio. */
  @ApiProperty({ format: 'date' }) startsOn!: string;
  /** Fecha de fin del ejercicio. */
  @ApiProperty({ format: 'date' }) endsOn!: string;
  /** El período abierto que cubre hoy; si no hay, el último; sin períodos, cadena vacía. */
  @ApiProperty() currentPeriodId!: string;
  /** Los períodos del ejercicio, en orden cronológico. */
  @ApiProperty({ type: [CockpitFiscalPeriodDto] })
  periods!: CockpitFiscalPeriodDto[];
  /** Cantidad de períodos devueltos. */
  @ApiProperty() count!: number;
}

/** Una partida abierta de la cartera. */
export class CockpitOpenItemDto {
  /** Identificador de la partida. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Número de documento de origen. */
  @ApiProperty() documentNumber!: string;
  /** Código de la cuenta de reconciliación. */
  @ApiProperty() accountCode!: string;
  /** Nombre de la cuenta de reconciliación. */
  @ApiProperty() accountName!: string;
  /** Nombre del socio de negocio dueño de la partida. */
  @ApiProperty() partnerName!: string;
  /** Lado de la cartera. */
  @ApiProperty({ enum: ['RECEIVABLE', 'PAYABLE'] })
  side!: 'RECEIVABLE' | 'PAYABLE';
  /** Fecha del documento de origen. */
  @ApiProperty({ format: 'date' }) documentDate!: string;
  /** Fecha de vencimiento. */
  @ApiProperty({ format: 'date' }) dueDate!: string;
  /** Importe original del documento. */
  @ApiProperty() amount!: string;
  /** Importe ya compensado. */
  @ApiProperty() clearedAmount!: string;
  /** Importe pendiente. */
  @ApiProperty() openAmount!: string;
  /** Días de atraso sobre `dueDate` (0 si no vencida). */
  @ApiProperty({ example: 0 }) overdueDays!: number;
  /** Tramo de antigüedad al que pertenece. */
  @ApiProperty() agingBucket!: string;
}

/** Un tramo de antigüedad de la cartera. */
export class CockpitAgingBucketDto {
  /** Clave del tramo (`CORRIENTE`, `D1_30`, …). */
  @ApiProperty() bucket!: string;
  /** Rótulo del tramo para pantalla. */
  @ApiProperty() label!: string;
  /** Total por cobrar del tramo. */
  @ApiProperty() receivable!: string;
  /** Total por pagar del tramo. */
  @ApiProperty() payable!: string;
  /** Cantidad de partidas del tramo. */
  @ApiProperty() count!: number;
}

/** Respuesta de `GET /accounting/open-items`: la cartera de la práctica. */
export class CockpitOpenItemsPageDto {
  /** Las partidas abiertas. */
  @ApiProperty({ type: [CockpitOpenItemDto] }) items!: CockpitOpenItemDto[];
  /** Los cinco tramos de antigüedad, siempre presentes y en orden. */
  @ApiProperty({ type: [CockpitAgingBucketDto] })
  aging!: CockpitAgingBucketDto[];
  /** Total por cobrar de la práctica. */
  @ApiProperty() totalReceivable!: string;
  /** Total por pagar de la práctica. */
  @ApiProperty() totalPayable!: string;
  /** Cantidad de partidas devueltas. */
  @ApiProperty() count!: number;
}

/** Una dimensión analítica (centro de coste, de beneficio o segmento) con su saldo. */
export class CockpitDimensionDto {
  /** Identificador de la dimensión. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código de la dimensión. */
  @ApiProperty() code!: string;
  /** Nombre de la dimensión. */
  @ApiProperty() name!: string;
  /** Tipo de dimensión. */
  @ApiProperty({ enum: ['COST_CENTER', 'PROFIT_CENTER', 'SEGMENT'] })
  kind!: 'COST_CENTER' | 'PROFIT_CENTER' | 'SEGMENT';
  /** Debe acumulado, sólo asientos POSTEADOS. */
  @ApiProperty() debit!: string;
  /** Haber acumulado, sólo asientos POSTEADOS. */
  @ApiProperty() credit!: string;
  /** `credit − debit`. */
  @ApiProperty() result!: string;
}

/** Respuesta de `GET /accounting/dimensions`. */
export class CockpitDimensionsDto {
  /** Centros de coste, de beneficio y segmentos, con su saldo. */
  @ApiProperty({ type: [CockpitDimensionDto] }) items!: CockpitDimensionDto[];
  /** Cantidad de dimensiones devueltas. */
  @ApiProperty() count!: number;
}

/** Un nodo del flujo del documento (asiento original, actual o reversión). */
export class CockpitDocumentFlowNodeDto {
  /** Identificador del asiento. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** El papel del asiento en el flujo. */
  @ApiProperty({ enum: ['ORIGEN', 'ACTUAL', 'REVERSION'] })
  role!: 'ORIGEN' | 'ACTUAL' | 'REVERSION';
  /** Número del asiento. */
  @ApiProperty() transactionNumber!: string;
  /** Fecha del asiento. */
  @ApiProperty() transactionDate!: Date;
  /** Importe total del asiento. */
  @ApiProperty() totalAmount!: string;
  /** Estado del asiento. */
  @ApiProperty() status!: string;
}

/** Respuesta de `GET /accounting/journal-transactions/:id/document-flow`. */
export class CockpitDocumentFlowDto {
  /** El asiento consultado y su reversión, si la tiene, en orden. */
  @ApiProperty({ type: [CockpitDocumentFlowNodeDto] })
  items!: CockpitDocumentFlowNodeDto[];
}

/** Un activo fijo del registro. */
export class CockpitFixedAssetDto {
  /** Identificador del activo. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código del activo. */
  @ApiProperty() code!: string;
  /** Nombre del activo. */
  @ApiProperty() name!: string;
  /** Nombre de la clase de activo (del concepto de tipo). */
  @ApiProperty() className!: string;
  /** Código de la clase de activo (del concepto de tipo). */
  @ApiProperty() classCode!: string;
  /** Vida útil en meses. */
  @ApiProperty({ example: 60 }) usefulLifeMonths!: number;
  /** Costo de adquisición. */
  @ApiProperty() acquisitionCost!: string;
  /** Depreciación acumulada (columna, no derivada). */
  @ApiProperty() accumulatedDepreciation!: string;
  /** Valor neto en libros. */
  @ApiProperty() netBookValue!: string;
  /** Cuota mensual de la próxima corrida (aún no corrida). */
  @ApiProperty() monthlyDepreciation!: string;
  /** Si la próxima corrida lo depreciaría. */
  @ApiProperty() depreciable!: boolean;
  /** Estado del activo. */
  @ApiProperty({ enum: ['ACTIVE', 'RETIRED'] }) status!: 'ACTIVE' | 'RETIRED';
}

/** Respuesta de `GET /accounting/assets`. */
export class CockpitFixedAssetsDto {
  /** Los activos de la práctica, ordenados por código. */
  @ApiProperty({ type: [CockpitFixedAssetDto] })
  items!: CockpitFixedAssetDto[];
  /** Suma de costos de adquisición. */
  @ApiProperty() totalAcquisition!: string;
  /** Suma de depreciación acumulada. */
  @ApiProperty() totalAccumulated!: string;
  /** Suma de valor neto en libros. */
  @ApiProperty() totalNetBookValue!: string;
  /** Suma de la cuota mensual, sólo activos depreciables. */
  @ApiProperty() monthlyCharge!: string;
  /** Cantidad de activos devueltos. */
  @ApiProperty() count!: number;
}

/** Un objeto de devengo del registro. */
export class CockpitAccrualObjectDto {
  /** Identificador del objeto de devengo. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Código del objeto (su `objectNumber`). */
  @ApiProperty() code!: string;
  /** Nombre del objeto (hoy, el mismo `objectNumber`: no hay columna `name`). */
  @ApiProperty() name!: string;
  /** Si es un devengo de gasto o de ingreso, según la cuenta que debita. */
  @ApiProperty({ enum: ['EXPENSE', 'REVENUE'] })
  kind!: 'EXPENSE' | 'REVENUE';
  /** Importe total del devengo. */
  @ApiProperty() totalAmount!: string;
  /** Cantidad de períodos del cronograma. */
  @ApiProperty() periods!: number;
  /** Períodos ya posteados. */
  @ApiProperty() postedPeriods!: number;
  /** Períodos pendientes. */
  @ApiProperty() remainingPeriods!: number;
  /** Importe de la próxima línea pendiente. */
  @ApiProperty() periodAmount!: string;
  /** Suma de lo ya posteado. */
  @ApiProperty() recognizedAmount!: string;
  /** Suma de lo planificado, aún no posteado. */
  @ApiProperty() pendingAmount!: string;
  /** Fecha de inicio del devengo. */
  @ApiProperty({ format: 'date' }) startsOn!: string;
  /** Si ya no quedan líneas pendientes. */
  @ApiProperty() completed!: boolean;
}

/** Respuesta de `GET /accounting/accrual-objects`. */
export class CockpitAccrualsDto {
  /** Los objetos de devengo de la práctica. */
  @ApiProperty({ type: [CockpitAccrualObjectDto] })
  items!: CockpitAccrualObjectDto[];
  /** Suma de `pendingAmount` de todos los objetos. */
  @ApiProperty() pendingTotal!: string;
  /** Suma de `periodAmount` de los objetos no completados. */
  @ApiProperty() periodCharge!: string;
  /** Cantidad de objetos devueltos. */
  @ApiProperty() count!: number;
}
