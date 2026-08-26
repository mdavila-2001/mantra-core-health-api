/* ============================================================================
    Las cuentas de demostración de los proveedores.

    Una por tipo de socio comercial del registro de procesos: farmacia,
    laboratorio de sangre, centro de análisis por imagen y aseguradora. Son las
    que permiten *entrar* como cada uno y ver su lado de la aplicación.

    El correo lleva el sufijo `@alovida.test`, que es un dominio reservado para
    pruebas y no puede recibir correo de verdad: si alguna de estas cuentas se
    filtrara a un entorno real, no habría a dónde mandarle nada.
   ========================================================================== */

/** Una cuenta de proveedor a sembrar. */
export interface ProviderAccountSeed {
  /** Con qué se inicia sesión. */
  readonly email: string;
  /** Cómo se llama la persona detrás de la cuenta. */
  readonly displayName: string;
  /** El rol con el que entra; gobierna qué pantallas ve. */
  readonly initialRole: string;
  /** Qué socio comercial representa, para el mensaje del log. */
  readonly organizacion: string;
}

/**
 * Las cuatro cuentas, una por módulo de socio del registro de procesos.
 *
 * Los roles salen de `authz.roles` y existen desde antes: `PHARMACY_OPERATOR`,
 * `LAB_OPERATOR`, `RADIOLOGIST` e `INSURANCE_OPERATOR`. No se inventa ninguno.
 *
 * **Por qué hacen falta**, si el paquete de seeds ya siembra 16 farmacias, 6
 * unidades de diagnóstico y 12 aseguradoras: porque esas filas describen la
 * *organización*, no a *quién entra por ella*. Sus operadores existen —14
 * perfiles de proveedor, 17 representantes de aseguradora— pero su credencial
 * quedó con el relleno del generador (`IAM-AUTHENTICATI-000003`), que no es un
 * identificador que nadie pueda tipear ni tiene contraseña conocida. En los
 * hechos, nadie podía entrar como farmacia, laboratorio ni aseguradora.
 */
export const PROVIDER_ACCOUNTS: readonly ProviderAccountSeed[] = [
  {
    email: 'farmacia.demo@alovida.test',
    displayName: 'Operador de Farmacia (demo)',
    initialRole: 'PHARMACY_OPERATOR',
    organizacion: 'farmacia',
  },
  {
    email: 'laboratorio.demo@alovida.test',
    displayName: 'Operador de Laboratorio (demo)',
    initialRole: 'LAB_OPERATOR',
    organizacion: 'laboratorio de sangre',
  },
  {
    email: 'imagen.demo@alovida.test',
    displayName: 'Operador de Imagen (demo)',
    initialRole: 'RADIOLOGIST',
    organizacion: 'centro de análisis por imagen',
  },
  {
    email: 'aseguradora.demo@alovida.test',
    displayName: 'Operador de Aseguradora (demo)',
    initialRole: 'INSURANCE_OPERATOR',
    organizacion: 'aseguradora de salud',
  },
];
