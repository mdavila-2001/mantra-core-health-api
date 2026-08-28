/* ============================================================================
    Las aseguradoras bolivianas, y los planes con los que operan.

    El registro de procesos lo pide dos veces, casi con las mismas palabras. Para
    el seguro privado: «aquí tienen que estar registrado en nuestra base de datos
    todas las compañías de seguro que ofrecen seguro de salud, Alianza, Nacional,
    Bisa, Fortaleza, etc.». Y para el público: «aquí tienen que estar registrado
    en nuestra base de datos todos los seguros de salud públicos, CNS, CPS, SUS,
    Bancaria, etc.».

    Las doce aseguradoras que había en la base eran inventadas —«Aseguradora
    Horizonte Salud Demo», «Cobertura Internacional Sandbox»—, suficientes para
    ejercitar una FK y nada más. Éstas existen, tienen NIT y son las que un
    paciente boliviano va a buscar en la lista.
   ========================================================================== */

import { deterministicId } from '../constants/concepts';
import dataset from './data/bolivia/insurance-carriers.dataset.json';

/** Una aseguradora tal como la declara el listado del stakeholder. */
export interface BoliviaCarrierSeed {
  /** Código estable derivado de la sigla; es la clave natural. */
  readonly code: string;
  /** Nombre con el que está constituida. */
  readonly razonSocial: string;
  /** Cómo se la nombra en el giro comercial. */
  readonly sigla: string;
  /** Número de identificación tributaria. */
  readonly nit: string;
  /** Dirección de su oficina principal. */
  readonly direccion: string;
  /** `PERSONAS` (vende salud y vida) o `GENERALES` (bienes y fianzas). */
  readonly ramo: string;
  /** Si vende seguro de salud, que es lo único que le importa al paciente. */
  readonly ofreceSalud: boolean;
}

/**
 * Las diecisiete compañías del listado, sin repetir.
 *
 * Son veinte filas en el markdown de origen: tres compañías aparecen en las dos
 * tablas —venden salud *y* bienes— y se cargan una sola vez, porque una misma
 * empresa con un solo NIT es una sola aseguradora. Lo que cambia entre una
 * mitad y otra es el ramo, y eso queda en `ramo`.
 */
export const BOLIVIA_CARRIERS = dataset.datos as readonly BoliviaCarrierSeed[];

/**
 * Los planes de salud que los propios listados de red nombran.
 *
 * No se inventan: son los que aparecen en la columna «Seguro habilitado» de la
 * red de Alianza y en «Plan habilitado» de la de Nacional Seguros, que es como
 * el médico y el paciente los conocen. Un plan tiene que existir para que
 * `insurance.patient_coverages` pueda apuntarle: esa tabla no referencia a la
 * aseguradora sino al plan concreto, así que sin planes un paciente no puede
 * declarar su cobertura aunque la compañía esté cargada.
 *
 * `ACC. PERSONALES` queda fuera a propósito: es accidentes personales, no un
 * plan de salud, y ofrecerlo donde se pregunta por cobertura médica confundiría.
 */
export const BOLIVIA_HEALTH_PLANS: readonly {
  /** Código de la aseguradora que lo emite. */
  readonly carrierCode: string;
  /** Código del plan, único dentro de su aseguradora. */
  readonly code: string;
  /** Cómo se llama el plan en la red. */
  readonly name: string;
}[] = [
  {
    carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A',
    code: 'AFI_GOLD',
    name: 'AFI Gold',
  },
  { carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A', code: 'OASIS', name: 'Oasis' },
  { carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A', code: 'SILVER', name: 'Silver' },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    code: 'SALUD_FLEXIBLE',
    name: 'Salud Flexible',
  },

  // --- Planes del cuadro de productos por aseguradora (stakeholder, 27/08) ---
  // Sólo entran los productos con componente de salud o de indemnización
  // médica: vida pura, desgravamen, sepelio, SOAT y rentas vitalicias quedan
  // afuera, porque acá se le pregunta al paciente por su cobertura médica y
  // ofrecerle su desgravamen hipotecario no lo ayuda a elegir.
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'ADVANCE',
    name: 'Advance',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'RED_MAX',
    name: 'Red Max',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'INFINITY_GREEN',
    name: 'Infinity Green',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'MUNDIAL_BLUE',
    name: 'Mundial Blue',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'NARANJA_PLUS',
    name: 'Naranja Plus',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    code: 'VIDA_SALUD_PLUS',
    name: 'Vida Salud Plus',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    code: 'AP_MUJER',
    name: 'AP Mujer / Protección Familiar',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    code: 'ONCOLOGICO',
    name: 'Oncológico Especializado y Renta Médica',
  },
  {
    carrierCode: 'BO_ASEG_CREDISEGURO_S_A_SEGUROS_PERSONALES',
    code: 'VIDA_SALUD_INTEGRAL',
    name: 'Vida + Salud Integral',
  },
  {
    carrierCode: 'BO_ASEG_CREDISEGURO_S_A_SEGUROS_PERSONALES',
    code: 'RENTA_HOSPITALARIA',
    name: 'Renta Hospitalaria e Indemnización Oncológica',
  },
  {
    carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A',
    code: 'ASISTENCIA_FAMILIAR',
    name: 'Asistencia Familiar Integral',
  },
  {
    carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A',
    code: 'ACCIDENTES_PERSONALES',
    name: 'Accidentes Personales',
  },
  {
    carrierCode: 'BO_ASEG_FORTALEZA_SEGUROS_Y_REASEGUROS_S_A',
    code: 'ACCIDENTES_PERSONALES',
    name: 'Accidentes Personales',
  },
  {
    carrierCode: 'BO_ASEG_LA_BOLIVIANA_CIACRUZ_SEGUROS_PERSONALES_S_A',
    code: 'ACCIDENTES_ESCOLARES',
    name: 'Accidentes Escolares y Universitarios',
  },
  {
    carrierCode: 'BO_ASEG_LA_BOLIVIANA_CIACRUZ_SEGUROS_PERSONALES_S_A',
    code: 'ACCIDENTES_PERSONALES_24_7',
    name: 'Accidentes Personales 24/7',
  },
  {
    carrierCode: 'BO_ASEG_UNIVIDA_S_A',
    code: 'ACCIDENTES_PERSONALES_ANUAL',
    name: 'Accidentes Personales Anual (urbano y rural)',
  },
  {
    carrierCode: 'BO_ASEG_UNIVIDA_S_A',
    code: 'RENTA_HOSPITALARIA',
    name: 'Renta Hospitalaria',
  },
  {
    carrierCode: 'BO_ASEG_SANTA_CRUZ_VIDA_Y_SALUD_S_A',
    code: 'RENTA_HOSPITALIZACION',
    name: 'Vida + Subsidio / Renta por Hospitalización',
  },
  {
    carrierCode: 'BO_ASEG_SANTA_CRUZ_VIDA_Y_SALUD_S_A',
    code: 'ACCIDENTES_PERSONALES_COLECTIVO',
    name: 'Accidentes Personales Colectivo',
  },
];

/**
 * Los seguros de salud públicos y de la seguridad social.
 *
 * El registro de procesos los pide en una pregunta aparte de la del seguro
 * privado —«cuenta con seguro salud publico… CNS, CPS, SUS, Bancaria»— y son
 * cosa distinta: no se contrata una póliza, se pertenece por el empleo o por
 * ley. Se cargan como aseguradoras porque el modelo tiene una sola tabla de
 * pagador y porque la cobertura del paciente apunta a un plan igual que en el
 * privado; lo que los separa es el ramo `PUBLICO`.
 *
 * Las siete cajas salen del listado de establecimientos del stakeholder, que las
 * enumera con su dirección y su teléfono en Santa Cruz. El SUS no está en ese
 * listado —no es una caja con sede, es una política de cobertura universal— pero
 * el registro de procesos lo nombra explícitamente, así que se incluye.
 */
export const BOLIVIA_PUBLIC_INSURERS: readonly {
  /** Código estable. */
  readonly code: string;
  /** Nombre oficial. */
  readonly razonSocial: string;
  /** Sigla con la que se lo conoce. */
  readonly sigla: string;
}[] = [
  {
    code: 'BO_PUB_CNS',
    razonSocial: 'Caja Nacional de Salud',
    sigla: 'CNS',
  },
  {
    code: 'BO_PUB_CPS',
    razonSocial: 'Caja Petrolera de Salud',
    sigla: 'CPS',
  },
  {
    code: 'BO_PUB_COSSMIL',
    razonSocial: 'Corporación del Seguro Social Militar',
    sigla: 'COSSMIL',
  },
  {
    code: 'BO_PUB_CORDES',
    razonSocial: 'Caja de Salud CORDES',
    sigla: 'CORDES',
  },
  {
    code: 'BO_PUB_CAMINOS',
    razonSocial: 'Caja de Salud de Caminos y Ramas Anexas',
    sigla: 'Caja de Caminos',
  },
  {
    code: 'BO_PUB_BANCA_PRIVADA',
    razonSocial: 'Caja de Salud de la Banca Privada',
    sigla: 'CSBP',
  },
  {
    code: 'BO_PUB_SSU',
    razonSocial: 'Seguro Social Universitario',
    sigla: 'SSU',
  },
  {
    code: 'BO_PUB_SUS',
    razonSocial: 'Sistema Único de Salud',
    sigla: 'SUS',
  },
];

/** Id determinista de la aseguradora, a partir de su código. */
export const carrierId = (code: string): string =>
  deterministicId(`seed:insurance-carrier:bo:${code}`);

/** Id determinista del producto de salud de una aseguradora. */
export const carrierProductId = (code: string): string =>
  deterministicId(`seed:insurance-product:bo:${code}`);

/** Id determinista de un plan, único dentro de su aseguradora. */
export const carrierPlanId = (carrierCode: string, planCode: string): string =>
  deterministicId(`seed:insurance-plan:bo:${carrierCode}:${planCode}`);

/** A qué mitad del catálogo pertenece un plan: privada o pública. */
export type InsuranceSector = 'private' | 'public';

/**
 * Índice plan → sector, construido una sola vez.
 *
 * Todas las aseguradoras tienen plan `BASE` («no sé cuál tengo») y algunas
 * publican además planes con nombre; ambas familias entran acá.
 */
const SECTOR_BY_PLAN_ID: ReadonlyMap<string, InsuranceSector> = (() => {
  const index = new Map<string, InsuranceSector>();
  const register = (carrierCode: string, sector: InsuranceSector): void => {
    index.set(carrierPlanId(carrierCode, 'BASE'), sector);
  };
  for (const carrier of BOLIVIA_CARRIERS) register(carrier.code, 'private');
  for (const insurer of BOLIVIA_PUBLIC_INSURERS)
    register(insurer.code, 'public');
  for (const plan of BOLIVIA_HEALTH_PLANS) {
    const esPublica = BOLIVIA_PUBLIC_INSURERS.some(
      (i) => i.code === plan.carrierCode,
    );
    index.set(
      carrierPlanId(plan.carrierCode, plan.code),
      esPublica ? 'public' : 'private',
    );
  }
  return index;
})();

/**
 * De qué sector es el plan que alguien declara, o `undefined` si no es del
 * catálogo sembrado.
 *
 * Existe porque la distinción público/privado **no está en la base**: el modelo
 * tiene una sola tabla de pagador y ninguna columna que separe una caja de
 * salud de una compañía de seguros. La fuente de verdad es este catálogo, que
 * es el mismo que decidió qué sembrar — más defendible que mirar el prefijo del
 * código, que cualquier alta futura puede no respetar.
 */
export const declaredPlanSector = (
  planId: string,
): InsuranceSector | undefined => SECTOR_BY_PLAN_ID.get(planId);

/** Si una aseguradora del catálogo es un seguro público o de seguridad social. */
export const isPublicCarrierId = (id: string): boolean =>
  BOLIVIA_PUBLIC_INSURERS.some((i) => carrierId(i.code) === id);
