/** Maximum lengths shared by person registration and profile updates. */
export const PERSON_NAME_PART_MAX_LENGTH = 100;
export const OCCUPATION_FREE_TEXT_MAX_LENGTH = 200;
export const EMPLOYER_FREE_TEXT_MAX_LENGTH = 200;
export const PHONE_MAX_LENGTH = 40;
export const PHONE_PATTERN = /^[+]?[0-9 ()-]{6,}$/;
export const PHONE_PATTERN_MESSAGE =
  'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion';
