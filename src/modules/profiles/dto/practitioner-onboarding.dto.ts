import { ApiProperty } from '@nestjs/swagger';

/**
 * Las cinco etapas del alta del profesional, en el orden en que se recorren.
 *
 * Son claves y no prosa a propósito: la API dice **qué** falta y el front
 * decide cómo pedírselo a la persona. Un cambio de redacción no es un cambio
 * de contrato.
 */
export const ONBOARDING_STEP_KEYS = [
  'professional-data',
  'photo',
  'organizations',
  'schedule',
  'review',
] as const;

/** Una de las cinco etapas. */
export type OnboardingStepKey = (typeof ONBOARDING_STEP_KEYS)[number];

/**
 * Qué le falta a una etapa, en claves estables.
 *
 * Mismo criterio que las etapas: `license-number` viaja así y el texto
 * «Cargá tu matrícula» lo pone quien dibuja la pantalla.
 */
export const ONBOARDING_MISSING_KEYS = [
  'license-number',
  'specialty',
  'photo',
  'affiliation',
  'schedule',
  'slots',
] as const;

/** Un dato pendiente dentro de una etapa. */
export type OnboardingMissingKey = (typeof ONBOARDING_MISSING_KEYS)[number];

/** Una etapa del alta, con lo que le falta para darse por cumplida. */
export class OnboardingStepDto {
  /** Cuál de las cinco etapas es. */
  @ApiProperty({ enum: ONBOARDING_STEP_KEYS })
  key!: OnboardingStepKey;

  /** Si ya está cumplida con los datos que hoy existen. */
  @ApiProperty()
  complete!: boolean;

  /**
   * Los datos que faltan, en claves estables. Vacío cuando la etapa está
   * cumplida.
   */
  @ApiProperty({ isArray: true, enum: ONBOARDING_MISSING_KEYS })
  missing!: OnboardingMissingKey[];
}

/**
 * En qué punto del alta está el profesional — respuesta de
 * `GET /profiles/practitioners/me/onboarding`.
 *
 * ## Por qué no hay «paso guardado»
 *
 * Porque el paso se **deriva** de los datos que ya existen: matrícula,
 * especialidad, foto, dónde atiende y si publicó horarios. Persistir un
 * contador sería una segunda verdad sobre los mismos hechos, y las dos
 * verdades se separan: bastaría con que alguien cargue su foto por otra
 * pantalla para que el contador mintiera.
 *
 * Deriva también significa que retomar sale gratis —volver a entrar recalcula
 * y aterriza donde corresponde— y que los profesionales dados de alta antes de
 * que esta pantalla existiera aparecen completos sin migrar una sola fila.
 */
export class PractitionerOnboardingDto {
  /** Perfil profesional al que corresponde el avance. */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /** Las cinco etapas, siempre las cinco y siempre en orden. */
  @ApiProperty({ type: [OnboardingStepDto] })
  steps!: OnboardingStepDto[];

  /**
   * La etapa en la que hay que aterrizar, o `done` si no falta ninguna.
   */
  @ApiProperty({ enum: [...ONBOARDING_STEP_KEYS, 'done'] })
  firstIncomplete!: OnboardingStepKey | 'done';
}
