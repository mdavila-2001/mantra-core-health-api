import type { AuthenticatedUser } from '../../../common';
import type { ClinicalReadService } from '../../clinical/services';
import { OBJECT_ACCESS_PURPOSES } from '../constants';

/** Por qué se denegó el acceso a un objeto clínico. Sólo para registro: el cliente no lo ve. */
export type ObjectAccessDenial =
  'PURPOSE_NOT_ALLOWED' | 'TENANT_MISMATCH' | 'PATIENT_ACCESS_DENIED';

/** Lo que la política necesita saber de lo que se quiere servir. */
export interface ObjectAccessTarget {
  /** Tenant dueño del objeto o del estudio. */
  readonly tenantId: string;
  /** Historia a la que cuelga; sin ella no hay expediente contra el que preguntar. */
  readonly patientProfileId?: string | null;
}

/**
 * La única comprobación de acceso a un objeto clínico (OBJ-01 / MCH-010): la
 * usan la emisión del enlace firmado y DICOMweb, para que ambas puertas no
 * puedan discrepar.
 *
 * Se responden tres preguntas, todas con datos que resuelve el servidor y no el
 * cliente:
 *
 * 1. **Finalidad conocida.** El texto declarado por el consumidor no autoriza
 *    nada: sólo cuenta si es una de las que la política entiende.
 * 2. **Custodia.** El actor tiene que ser miembro del tenant dueño. Tampoco un
 *    rol privilegiado sortea esto: un objeto de otro tenant es de otra
 *    organización.
 * 3. **Relación con el paciente.** Si cuelga de una historia, decide
 *    `ClinicalReadService.assertCanReadHistory`, la misma política que guarda el
 *    expediente. Un objeto sin paciente —un backup, un adjunto administrativo—
 *    queda con la custodia del tenant y el rol del endpoint.
 *
 * Devuelve la causa de la denegación en vez de lanzar, para que cada llamador
 * la registre a su manera y responda con su propio error uniforme.
 *
 * @param clinicalAccess - Política del expediente.
 * @param target - Tenant y paciente del objeto o estudio.
 * @param actor - Quien pide el acceso.
 * @param purposeOfUseCode - Finalidad declarada.
 * @returns La causa de la denegación, o `undefined` si el acceso procede.
 */
export async function findObjectAccessDenial(
  clinicalAccess: Pick<ClinicalReadService, 'assertCanReadHistory'>,
  target: ObjectAccessTarget,
  actor: AuthenticatedUser,
  purposeOfUseCode: string | undefined,
): Promise<ObjectAccessDenial | undefined> {
  if (!purposeOfUseCode || !OBJECT_ACCESS_PURPOSES.includes(purposeOfUseCode)) {
    return 'PURPOSE_NOT_ALLOWED';
  }
  if (!(actor.tenantIds ?? []).includes(target.tenantId)) {
    return 'TENANT_MISMATCH';
  }
  if (!target.patientProfileId) return undefined;

  try {
    await clinicalAccess.assertCanReadHistory(target.patientProfileId, actor);
  } catch {
    // La política responde 403 con el detalle del expediente; acá se uniforma,
    // porque quien pregunta ni siquiera debería saber que el objeto existe.
    return 'PATIENT_ACCESS_DENIED';
  }
  return undefined;
}
