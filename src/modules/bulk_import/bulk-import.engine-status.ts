/**
 * Estado declarado del motor en esta instalación.
 *
 * El motor es completo, pero tres colaboradores pueden ser, según el
 * despliegue, un adaptador real o un doble/«no conectado». Este objeto lo dice
 * en voz alta —`GET /admin/bulk-imports/templates` lo devuelve— para que nadie
 * lea «creados: 40» sin saber contra qué se escribió.
 */
export interface BulkImportEngineStatus {
  readonly persistence: {
    /** `true` sólo si los lotes sobreviven a un reinicio y se comparten entre réplicas. */
    readonly durable: boolean;
    readonly adapter: string;
    readonly note?: string;
  };
  readonly executors: {
    readonly users: { readonly connected: boolean; readonly adapter: string };
    readonly clinical: {
      readonly connected: boolean;
      readonly adapter: string;
    };
  };
  readonly resolvers: {
    readonly patients: {
      readonly connected: boolean;
      readonly adapter: string;
    };
    readonly codes: { readonly connected: boolean; readonly adapter: string };
  };
}

/** Token de inyección del estado declarado. */
export const BULK_IMPORT_ENGINE_STATUS = Symbol('BULK_IMPORT_ENGINE_STATUS');
