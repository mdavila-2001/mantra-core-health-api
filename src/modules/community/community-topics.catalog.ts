import { deterministicId } from '../../common/constants/concepts';

/** A category (parent topic) with the topics that hang from it. */
export interface TopicCategory {
  readonly code: string;
  readonly name: string;
  readonly topics: readonly string[];
}

/** Parent of the topics people create themselves from the group form. */
export const OWN_TOPICS_CODE = 'CAT_TEMAS_PROPIOS';

/**
 * Base topic tree for groups and forums: one level of categories, each with
 * its topics. Codes derive from the names, so a name here is never renamed:
 * the deterministic id hangs from it.
 */
export const TOPIC_CATEGORIES: readonly TopicCategory[] = [
  {
    code: 'CAT_MEDICINA_CLINICA',
    name: 'Medicina clínica',
    topics: [
      'Medicina interna',
      'Medicina familiar',
      'Cardiología',
      'Neumología',
      'Gastroenterología',
      'Nefrología',
      'Endocrinología',
      'Diabetes',
      'Reumatología',
      'Hematología',
      'Infectología',
      'Oncología',
      'Geriatría',
      'Dermatología',
      'Alergia e inmunología',
    ],
  },
  {
    code: 'CAT_CIRUGIA',
    name: 'Cirugía',
    topics: [
      'Cirugía general',
      'Traumatología y ortopedia',
      'Neurocirugía',
      'Cirugía cardiovascular',
      'Cirugía plástica',
      'Urología',
      'Otorrinolaringología',
      'Oftalmología',
      'Cirugía pediátrica',
      'Anestesiología',
    ],
  },
  {
    code: 'CAT_MUJER_Y_NINEZ',
    name: 'Mujer y niñez',
    topics: [
      'Ginecología',
      'Obstetricia',
      'Pediatría',
      'Neonatología',
      'Lactancia',
      'Salud sexual y reproductiva',
    ],
  },
  {
    code: 'CAT_NEUROCIENCIAS_SALUD_MENTAL',
    name: 'Neurociencias y salud mental',
    topics: ['Neurología', 'Psiquiatría', 'Psicología clínica', 'Adicciones'],
  },
  {
    code: 'CAT_URGENCIAS_CUIDADOS_CRITICOS',
    name: 'Urgencias y cuidados críticos',
    topics: [
      'Medicina de emergencia',
      'Terapia intensiva',
      'Medicina del dolor',
      'Cuidados paliativos',
    ],
  },
  {
    code: 'CAT_DIAGNOSTICO',
    name: 'Diagnóstico',
    topics: [
      'Imagenología',
      'Laboratorio clínico',
      'Anatomía patológica',
      'Medicina nuclear',
      'Genética médica',
    ],
  },
  {
    code: 'CAT_ODONTOLOGIA',
    name: 'Odontología',
    topics: [
      'Odontología general',
      'Ortodoncia',
      'Endodoncia',
      'Periodoncia',
      'Cirugía maxilofacial',
      'Odontopediatría',
      'Rehabilitación oral',
    ],
  },
  {
    code: 'CAT_DISCIPLINAS_SALUD',
    name: 'Otras disciplinas de salud',
    topics: [
      'Enfermería',
      'Nutrición',
      'Fisioterapia y rehabilitación',
      'Fonoaudiología',
      'Farmacia',
      'Bioquímica',
      'Terapia ocupacional',
    ],
  },
  {
    code: 'CAT_SALUD_PUBLICA_GESTION',
    name: 'Salud pública y gestión',
    topics: [
      'Salud pública y epidemiología',
      'Medicina del trabajo',
      'Medicina deportiva',
      'Gestión hospitalaria',
      'Telemedicina',
      'Investigación y docencia',
      'Ética médica',
    ],
  },
  { code: OWN_TOPICS_CODE, name: 'Temas propios', topics: [] },
];

/** Stable code from a visible name: «Cirugía general» → `CIRUGIA_GENERAL`. */
export function topicCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/** Deterministic id of a topic, from its code. */
export function topicId(code: string): string {
  return deterministicId(`community:topic:${code}`);
}
