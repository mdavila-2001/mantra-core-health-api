import type { Server } from 'node:http';
import type { MikroORM } from '@mikro-orm/postgresql';

/**
 * Kit compartido del smoke test multi-módulo.
 *
 * Cada módulo aporta un archivo `test/smoke/modules/<modulo>.smoke.ts` que exporta
 * un `SmokeCase[]`. El runner (`smoke.int-spec.ts`) los reúne y los ejecuta en
 * orden compartiendo un único `SmokeCtx`, de modo que un caso puede crear un
 * recurso, capturar su id en `ctx.vars` y otro caso posterior consumirlo. Esto
 * distribuye la autoría del smoke a quien conoce los DTOs de cada módulo y evita
 * un runner monolítico.
 */

/** Contexto compartido entre todos los casos de una corrida. */
export interface SmokeCtx {
  /**
   * Valor de server mantenido por la instancia.
   */
  server: Server;
  /**
   * Valor de orm mantenido por la instancia.
   */
  orm: MikroORM;
  /**
   * Valor de admin token mantenido por la instancia.
   */
  adminToken: string;
  /**
   * Identificador asociado a admin user.
   */
  adminUserId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /** Subtipo de profesional (health_practitioner_profiles.id) sembrado como fixture. */
  practitionerSubtypeId: string;
  /** Subtipo de secretaría (secretary_profiles.id) sembrado como fixture. */
  secretaryProfileId: string;
  /** Subtipo de paciente (patient_profiles.id) sembrado como fixture. */
  patientSubtypeId: string;
  /** Plantilla de chart (specialty_chart_templates.id) sembrada como fixture. */
  chartTemplateId: string;
  /** Ids capturados por casos previos (p. ej. `vars.fileId`). */
  vars: Record<string, string>;
  /** Sufijo único de la corrida para datos que exigen unicidad. */
  u: number;
}

/** Un caso del smoke: un endpoint ejercido con un status esperado. */
export interface SmokeCase {
  /** Módulo lógico (p. ej. "Directory"). */
  module: string;
  /** Etiqueta del endpoint (p. ej. "POST /admin/tenants"). */
  endpoint: string;
  /** Descripción del caso (p. ej. "happy: datos completos" o "límite: 401"). */
  name: string;
  /**
   * Valor de method mantenido por la instancia.
   */
  method: 'post' | 'get' | 'delete' | 'patch' | 'put';
  /** Ruta concreta; recibe el ctx para interpolar ids capturados. */
  path: (c: SmokeCtx) => string;
  /** Cuerpo de la petición; opcional. */
  body?: (c: SmokeCtx) => unknown;
  /** `true` (por defecto) envía el token de admin; `false` no manda auth. */
  auth?: boolean;
  /**
   * Token con el que actuar, si no es el de admin.
   *
   * El recorrido de un paciente no se puede ejercer con el token de administrador: los endpoints
   * `/me` resuelven el titular desde el JWT, así que con el de admin devolverían los datos del
   * admin y el caso pasaría sin haber probado nada. Devolver aquí el token del propio paciente
   * —capturado en su login— es lo que convierte al caso en la prueba de un cliente real.
   */
  token?: (c: SmokeCtx) => string | undefined;
  /**
   * Valor de expected status mantenido por la instancia.
   */
  expectedStatus: number;
  /** Código de error estable esperado en respuestas 4xx (opcional). */
  expectedCode?: string;
  /** Prepara prerrequisitos que el API no permite crear directamente. */
  setup?: (c: SmokeCtx) => Promise<void>;
  /** Captura ids de la respuesta hacia `ctx.vars` para casos posteriores. */
  capture?: (resBody: Record<string, unknown>, c: SmokeCtx) => void;
}

/** Resultado registrado por caso. */
export interface SmokeResult {
  /**
   * Valor de module mantenido por la instancia.
   */
  module: string;
  /**
   * Valor de endpoint mantenido por la instancia.
   */
  endpoint: string;
  /**
   * Valor de test case mantenido por la instancia.
   */
  testCase: string;
  /**
   * Valor de method mantenido por la instancia.
   */
  method: string;
  /**
   * Valor de path mantenido por la instancia.
   */
  path: string;
  /**
   * Valor de expected status mantenido por la instancia.
   */
  expectedStatus: number;
  /**
   * Valor de actual status mantenido por la instancia.
   */
  actualStatus: number;
  /**
   * Valor de pass mantenido por la instancia.
   */
  pass: boolean;
  /**
   * Valor de error code mantenido por la instancia.
   */
  errorCode: string | null;
  /**
   * Valor de duration ms mantenido por la instancia.
   */
  durationMs: number;
  /**
   * Valor de note mantenido por la instancia.
   */
  note: string;
}

/** UUID que nunca existe (para casos de "recurso inexistente"). */
export const UUID_ABSENT = '00000000-0000-4000-8000-0000000000ff';
/** UUID malformado (para casos de validación de parámetro). */
export const UUID_BAD = 'not-a-uuid';
