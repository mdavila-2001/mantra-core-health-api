import type {
  Finding,
  FindingRule,
  FindingSeverity,
  PieceView,
} from './piece-view';

const WIRED_KINDS = new Set([
  'JOB_PROGRAMADO',
  'TEMPORIZADOR',
  'ENDPOINT_INTERNO',
  'SALUD',
]);

const make = (
  rule: FindingRule,
  severity: FindingSeverity,
  pieceId: string | null,
  message: string,
): Finding => ({
  id: `${rule}:${pieceId ?? '-'}`,
  rule,
  severity,
  pieceId,
  message,
});

const SEVERITY_ORDER: Readonly<Record<FindingSeverity, number>> = {
  ALTA: 0,
  MEDIA: 1,
  BAJA: 2,
  INFO: 3,
};

/**
 * Hallazgos: lo que el contraste deja a la vista y alguien debe mirar. Una
 * función pura sobre las vistas; el orden es estable (gravedad, regla, pieza).
 */
export function findingsOf(
  views: readonly PieceView[],
  codeScanAvailable: boolean,
): Finding[] {
  const out: Finding[] = [];
  if (!codeScanAvailable) {
    out.push(
      make(
        'CODIGO_NO_DISPONIBLE',
        'INFO',
        null,
        'El código fuente no está en este despliegue: no se puede detectar lo no registrado ni lo huérfano.',
      ),
    );
  }
  const handlerTypes = new Set(
    views
      .filter(
        (v) =>
          v.kind === 'CONSUMIDOR_COLA' &&
          typeof v.attributes.jobType === 'string',
      )
      .map((v) => String(v.attributes.jobType)),
  );
  for (const view of views) {
    if (view.state === 'NO_REGISTRADA') {
      out.push(
        make(
          'NO_REGISTRADA',
          'MEDIA',
          view.id,
          `${view.name} existe en el código y no está registrada.`,
        ),
      );
    }
    if (view.state === 'HUERFANA') {
      out.push(
        make(
          'HUERFANA',
          'MEDIA',
          view.id,
          `${view.name} está registrada pero ya no existe en el código.`,
        ),
      );
    }
    if (view.inCode && view.wired === false && WIRED_KINDS.has(view.kind)) {
      out.push(
        make(
          'NO_CABLEADA',
          'ALTA',
          view.id,
          `${view.name} está declarada pero ningún módulo la registra: nunca correrá.`,
        ),
      );
    }
    if (view.kind === 'PROCESO' && view.state === 'SIN_LATIDO') {
      out.push(
        view.required
          ? make(
              'SIN_LATIDO_REQUERIDA',
              'ALTA',
              view.id,
              `${view.name} es requerida y no se oye: ${view.causeDetail}.`,
            )
          : make(
              'SIN_LATIDO',
              'BAJA',
              view.id,
              `${view.name} no se oye (no es requerida en este entorno): ${view.causeDetail}.`,
            ),
      );
    }
    if (
      view.kind === 'PROCESO' &&
      view.inCode &&
      view.heartbeat.mode === 'PROCESS' &&
      view.cause === 'HOST_UNRESOLVED'
    ) {
      out.push(
        make(
          'FUERA_DE_SONDA',
          'MEDIA',
          view.id,
          `${view.name} no figura en el registro de la sonda de vida: sus latidos serían rechazados.`,
        ),
      );
    }
    if (
      view.kind === 'PROCESO' &&
      view.attributes.inComposeDev === false &&
      view.attributes.inCoolify === false
    ) {
      out.push(
        make(
          'NO_DESPLEGADA',
          'MEDIA',
          view.id,
          `${view.name} no tiene servicio en ningún compose: sólo arranca a mano.`,
        ),
      );
    }
    if (view.kind === 'JOB_NOMBRADO' && view.inCode) {
      const type = view.attributes.jobType;
      if (typeof type === 'string' && !handlerTypes.has(type)) {
        out.push(
          make(
            'JOB_SIN_CONSUMIDOR',
            'ALTA',
            view.id,
            `El job "${type}" se puede encolar pero ningún manejador está registrado para consumirlo.`,
          ),
        );
      }
    }
    if (view.registry.present && view.inCode && view.registry.stale) {
      out.push(
        make(
          'HUELLA_DESACTUALIZADA',
          'BAJA',
          view.id,
          `${view.name}: el registro quedó atrás del código; ejecutar el descubrimiento lo actualiza.`,
        ),
      );
    }
    if (view.registry.present && view.registry.provenance === null) {
      out.push(
        make(
          'SIN_PROCEDENCIA',
          'BAJA',
          view.id,
          `${view.name}: la fila del registro no declara su procedencia.`,
        ),
      );
    }
  }
  return out.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
