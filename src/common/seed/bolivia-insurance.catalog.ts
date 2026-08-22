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
