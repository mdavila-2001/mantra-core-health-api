import { ApiProperty } from '@nestjs/swagger';

/** Una fila de desglose: código, etiqueta (= código si no hay concepto) y conteo. */
export class DeviceBreakdownItemDto {
  @ApiProperty({
    description:
      'Código del concepto (p. ej. DESKTOP), la versión de app tal cual, o UNSPECIFIED si el contexto no informó la dimensión',
  })
  code!: string;

  @ApiProperty({
    description:
      'Etiqueta del concepto del catálogo; si el código no resuelve a un concepto, es igual a `code`',
  })
  label!: string;

  @ApiProperty({ description: 'Contextos de cliente no-bot con ese valor' })
  contexts!: number;
}

export class DevicesTotalsDto {
  @ApiProperty({
    description:
      'Contextos de cliente no-bot de la ventana; cada desglose suma como máximo esta cifra (hay un tope de filas por desglose)',
  })
  contexts!: number;

  @ApiProperty({
    description: 'Contextos con is_bot = true; no entran en ningún desglose',
  })
  bots!: number;
}

export class DevicesNotMeasuredDto {
  @ApiProperty() metric!: string;
  @ApiProperty() reason!: string;
}

export class DevicesWindowDto {
  @ApiProperty({ format: 'date-time' }) from!: string;
  @ApiProperty({ format: 'date-time' }) to!: string;
  @ApiProperty({ enum: ['hour', 'day'] }) interval!: 'hour' | 'day';
  @ApiProperty({ enum: ['UTC'] }) timezone!: 'UTC';
  @ApiProperty({ enum: ['WEB', 'MOBILE'], nullable: true })
  portal!: 'WEB' | 'MOBILE' | null;
}

/** Respuesta de `GET /admin/analytics/devices`: sólo agregados, sin ids ni PII. */
export class AnalyticsDevicesResponseDto {
  @ApiProperty({ type: DevicesWindowDto }) window!: DevicesWindowDto;
  @ApiProperty({ type: DevicesTotalsDto }) totals!: DevicesTotalsDto;
  @ApiProperty({ type: [DeviceBreakdownItemDto] })
  byDeviceType!: DeviceBreakdownItemDto[];
  @ApiProperty({ type: [DeviceBreakdownItemDto] })
  byOsFamily!: DeviceBreakdownItemDto[];
  @ApiProperty({ type: [DeviceBreakdownItemDto] })
  byBrowserFamily!: DeviceBreakdownItemDto[];
  @ApiProperty({ type: [DeviceBreakdownItemDto] })
  byAppVersion!: DeviceBreakdownItemDto[];
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  lastContextAt!: string | null;
  @ApiProperty({ type: [DevicesNotMeasuredDto] })
  notMeasured!: DevicesNotMeasuredDto[];
}
