import { ApiProperty } from '@nestjs/swagger';

/** Un día del desglose. */
export class ProfileStatsDayDto {
  @ApiProperty({ description: 'Día en YYYY-MM-DD (UTC)' })
  date!: string;

  @ApiProperty({ description: 'Visitas a la ficha pública ese día' })
  views!: number;

  @ApiProperty({ description: 'Veces que apareció en resultados ese día' })
  searchAppearances!: number;
}

/**
 * «Tu perfil esta semana» (`ORG-PUB-005`).
 *
 * Son **visitas, no visitantes únicos**: no se guarda ningún rastro del
 * visitante, así que no hay con qué deduplicarlo. Es una decisión, no una
 * limitación: contar visitas no justifica registrar quién miró el perfil de
 * qué médico.
 */
export class ProfileStatsDto {
  @ApiProperty({ description: 'Días que cubre la ventana' })
  windowDays!: number;

  @ApiProperty({ description: 'Visitas a la ficha en la ventana' })
  views!: number;

  @ApiProperty({ description: 'Apariciones en resultados en la ventana' })
  searchAppearances!: number;

  @ApiProperty({
    type: [ProfileStatsDayDto],
    description: 'Del más viejo al más nuevo',
  })
  daily!: ProfileStatsDayDto[];
}
