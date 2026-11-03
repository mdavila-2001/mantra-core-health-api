/* ============================================================================
    Las cuentas de demostración de las aseguradoras.

    Una por correo `acceso@<dominio>` de las 33 que sembraba el parche
    `2026-09-26_v4231_seed_insurer_accounts.sql`, con los mismos correos y el
    mismo tenant (el de la aseguradora, resuelto por su `carrier_code`). Antes
    llevaban una clave fija dentro del parche, que `postgres-init` aplicaba en
    todos los entornos; ahora solo se crean si el entorno lo pide
    (`SEED_DEMO_PASSWORD`) y nunca en producción sin permiso explícito.
   ========================================================================== */

/** Una cuenta de operador de aseguradora a sembrar. */
export interface InsurerAccountSeed {
  /** `insurance.insurance_carriers.carrier_code` de la aseguradora a la que pertenece. */
  readonly carrierCode: string;
  /** Con qué se inicia sesión. */
  readonly email: string;
  /** Cómo se llama la persona detrás de la cuenta. */
  readonly displayName: string;
}

/** Las 33 cuentas; una aseguradora puede tener más de un correo. */
export const INSURER_ACCOUNTS: readonly InsurerAccountSeed[] = [
  {
    carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A',
    email: 'acceso@alianza.com',
    displayName: 'Representante Legal - Alianza Vida S.A.',
  },
  {
    carrierCode: 'BO_ASEG_ALIANZA_VIDA_S_A',
    email: 'acceso@alianzavida.com',
    displayName: 'Representante Legal - Alianza Vida S.A.',
  },
  {
    carrierCode: 'BO_ASEG_ALIANZA_SEGUROS_S_A',
    email: 'acceso@alianzagenerales.com',
    displayName: 'Representante Legal - Alianza Seguros Patrimoniales',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    email: 'acceso@bisa.com',
    displayName: 'Representante Legal - BISA Seguros',
  },
  {
    carrierCode: 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
    email: 'acceso@bisaseguros.com',
    displayName: 'Representante Legal - BISA Seguros',
  },
  {
    carrierCode: 'BO_ASEG_CREDISEGURO_S_A_SEGUROS_PERSONALES',
    email: 'acceso@crediseguro.com',
    displayName: 'Representante Legal - Crediseguro Personales',
  },
  {
    carrierCode: 'BO_ASEG_CREDISEGURO_S_A_SEGUROS_GENERALES',
    email: 'acceso@credisegurogenerales.com',
    displayName: 'Representante Legal - Crediseguro Generales',
  },
  {
    carrierCode: 'BO_ASEG_FORTALEZA_SEGUROS_Y_REASEGUROS_S_A',
    email: 'acceso@fortaleza.com',
    displayName: 'Representante Legal - Fortaleza Seguros',
  },
  {
    carrierCode: 'BO_ASEG_FORTALEZA_SEGUROS_Y_REASEGUROS_S_A',
    email: 'acceso@segurosfortaleza.com',
    displayName: 'Representante Legal - Fortaleza Seguros',
  },
  {
    carrierCode: 'BO_ASEG_LA_BOLIVIANA_CIACRUZ_SEGUROS_PERSONALES_S_A',
    email: 'acceso@ciacruz.com',
    displayName: 'Representante Legal - La Boliviana Ciacruz Personales',
  },
  {
    carrierCode: 'BO_ASEG_LA_BOLIVIANA_CIACRUZ_SEGUROS_PERSONALES_S_A',
    email: 'acceso@lbc.bo',
    displayName: 'Representante Legal - La Boliviana Ciacruz Personales',
  },
  {
    carrierCode: 'BO_ASEG_LA_BOLIVIANA_CIACRUZ_DE_SEGUROS_Y_REASEGUROS',
    email: 'acceso@ciacruzgenerales.com',
    displayName: 'Representante Legal - La Boliviana Ciacruz Generales',
  },
  {
    carrierCode: 'BO_ASEG_LA_VITALICIA_SEGUROS_Y_REASEGUROS_DE_VIDA_S_',
    email: 'acceso@lavitalicia.com',
    displayName: 'Representante Legal - La Vitalicia Seguros',
  },
  {
    carrierCode: 'BO_ASEG_MERCANTIL_SANTA_CRUZ_SEGUROS_Y_REASEGUROS_GE',
    email: 'acceso@mercantil.com',
    displayName: 'Representante Legal - Mercantil Santa Cruz Seguros',
  },
  {
    carrierCode: 'BO_ASEG_MERCANTIL_SANTA_CRUZ_SEGUROS_Y_REASEGUROS_GE',
    email: 'acceso@msc.com',
    displayName: 'Representante Legal - Mercantil Santa Cruz Seguros',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    email: 'acceso@nacional.com',
    displayName: 'Representante Legal - Nacional Seguros Vida y Salud',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A',
    email: 'acceso@nacionalsalud.com',
    displayName: 'Representante Legal - Nacional Seguros Vida y Salud',
  },
  {
    carrierCode: 'BO_ASEG_NACIONAL_SEGUROS_PATRIMONIALES_Y_FIANZAS_S_A',
    email: 'acceso@nacionalpatrimoniales.com',
    displayName: 'Representante Legal - Nacional Seguros Patrimoniales',
  },
  {
    carrierCode: 'BO_ASEG_SANTA_CRUZ_VIDA_Y_SALUD_S_A',
    email: 'acceso@santacruz.com',
    displayName: 'Representante Legal - Santa Cruz Vida y Salud',
  },
  {
    carrierCode: 'BO_ASEG_SANTA_CRUZ_VIDA_Y_SALUD_S_A',
    email: 'consultasSCVS@santacruzfg.com',
    displayName: 'Representante Legal - Santa Cruz Vida y Salud',
  },
  {
    carrierCode: 'BO_ASEG_SEGUROS_ILLIMANI_S_A',
    email: 'acceso@illimani.com',
    displayName: 'Representante Legal - Seguros Illimani',
  },
  {
    carrierCode: 'BO_ASEG_SEGUROS_Y_REASEGUROS_CREDINFORM_INTERNATIONA',
    email: 'acceso@credinform.com',
    displayName: 'Representante Legal - Credinform International',
  },
  {
    carrierCode: 'BO_ASEG_UNIBIENES_S_A',
    email: 'acceso@unibienes.com',
    displayName: 'Representante Legal - UNIBIENES Seguros',
  },
  {
    carrierCode: 'BO_ASEG_UNIVIDA_S_A',
    email: 'acceso@univida.com',
    displayName: 'Representante Legal - UNIVIDA Seguros',
  },
  {
    carrierCode: 'BO_PUB_BANCA_PRIVADA',
    email: 'acceso@csbp.com.bo',
    displayName: 'Operador Caja de Salud de la Banca Privada (CSBP)',
  },
  {
    carrierCode: 'BO_PUB_CAMINOS',
    email: 'acceso@caminos.gob.bo',
    displayName: 'Operador Caja de Salud de Caminos',
  },
  {
    carrierCode: 'BO_PUB_CNS',
    email: 'acceso@cns.gob.bo',
    displayName: 'Operador Caja Nacional de Salud (CNS)',
  },
  {
    carrierCode: 'BO_PUB_CORDES',
    email: 'acceso@cordes.org.bo',
    displayName: 'Operador Caja de Salud CORDES',
  },
  {
    carrierCode: 'BO_PUB_COSSMIL',
    email: 'acceso@cossmil.mil.bo',
    displayName: 'Operador Corporación del Seguro Social Militar (COSSMIL)',
  },
  {
    carrierCode: 'BO_PUB_CPS',
    email: 'acceso@cps.org.bo',
    displayName: 'Operador Caja Petrolera de Salud (CPS)',
  },
  {
    carrierCode: 'BO_PUB_SSU',
    email: 'acceso@ssu.edu.bo',
    displayName: 'Operador Seguro Social Universitario (SSU)',
  },
  {
    carrierCode: 'BO_PUB_SUS',
    email: 'acceso@minsalud.gob.bo',
    displayName: 'Operador Sistema Único de Salud (SUS)',
  },
  {
    carrierCode: 'DEMO-07qj6',
    email: 'acceso@aseguradorademo.com',
    displayName: 'Operador Aseguradora Demo',
  },
];
