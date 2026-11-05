/**
 * DTOs Perioperatorios (Fachada Modular Hexagonal).
 *
 * Descompuesto según la directiva LEAN (≤ 300 líneas por archivo):
 * - ./common: Tipos de lateralidad y severidad clínica
 * - ./cases: UC-53-01 (Programación), UC-53-02 (Diagnósticos/Equipo), Query, Detail
 * - ./preop: UC-53-03 (Valoración Preoperatoria), UC-53-04 (Órdenes)
 * - ./safety: UC-53-05 (Checklist de Seguridad OMS)
 * - ./anesthesia: UC-53-06 (Plan de Anestesia), UC-53-07 (Eventos de Anestesia)
 * - ./intraop: UC-53-08 (Pasos/Hallazgos), UC-53-09 (Implantes), UC-53-10 (Insumos/Muestras)
 * - ./report: UC-53-11 (Reporte Operatorio)
 * - ./postop: UC-53-12 (PACU), UC-53-13 (Cancelación), UC-53-14 (Cargos/Utilización)
 */

export * from './common';
export * from './cases';
export * from './preop';
export * from './safety';
export * from './anesthesia';
export * from './intraop';
export * from './report';
export * from './postop';
