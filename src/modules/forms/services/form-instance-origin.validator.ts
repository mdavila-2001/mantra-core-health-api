import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { FormInstances } from '../entities';
import { FORMS } from '../forms.concepts';

/** Por qué una instancia de formulario no sirve como origen de un registro. */
export type FormInstanceOriginRejection =
  'NOT_FOUND' | 'NOT_CLOSED' | 'ENCOUNTER_MISMATCH';

/**
 * P43 — comprueba que la instancia de formulario de la que dice venir un
 * registro clínico (receta, orden, plan de cuidado) sirve como origen:
 * existe, está cerrada y es del mismo encuentro que el registro.
 *
 * Es una clase sin estado que recibe el `EntityManager` por parámetro —la
 * transacción del llamador—, así que los módulos que la usan la proveen suelta,
 * sin importar `FormsModule` entero: mismo criterio que los repositorios que
 * `clinical` y `chart` ya proveen de otros módulos.
 *
 * El campo es opcional en los tres creates: desde la historia del paciente se
 * sigue pudiendo emitir sin formulario. Sólo se valida cuando viaja.
 */
@Injectable()
export class FormInstanceOriginValidator {
  /**
   * Lanza 422 (`PRECONDITION_FAILED`) si la instancia no existe, no está
   * cerrada o pertenece a otro encuentro. Sin `encounterId` en el registro,
   * sólo se exige que exista y esté cerrada.
   *
   * "Pertenecer al encuentro" es `form_instances.resource_id = encounterId`: la
   * ficha médica se abre SOBRE la consulta (ver `FormsInstancesService`).
   *
   * @param em - Transacción activa del llamador.
   * @param formInstanceId - Instancia declarada como origen.
   * @param encounterId - Encuentro del registro, si lo tiene.
   */
  async assertUsableOrigin(
    em: EntityManager,
    formInstanceId: string,
    encounterId?: string | null,
  ): Promise<void> {
    const instance = await em.findOne(FormInstances, { id: formInstanceId });
    if (!instance) {
      throw this.reject('La instancia de formulario no existe', {
        formInstanceId,
        reason: 'NOT_FOUND',
      });
    }
    if (instance.stateConceptId !== FORMS.INSTANCE_CLOSED) {
      throw this.reject(
        'La instancia de formulario no está cerrada: el registro sólo puede salir de un formulario terminado',
        { formInstanceId, reason: 'NOT_CLOSED' },
      );
    }
    if (encounterId && instance.resourceId !== encounterId) {
      throw this.reject(
        'La instancia de formulario pertenece a otro encuentro',
        { formInstanceId, encounterId, reason: 'ENCOUNTER_MISMATCH' },
      );
    }
  }

  /** Arma el 422 con el motivo máquina-legible en `details.reason`. */
  private reject(
    message: string,
    details: {
      formInstanceId: string;
      encounterId?: string;
      reason: FormInstanceOriginRejection;
    },
  ): PreconditionFailedException {
    return new PreconditionFailedException(message, details);
  }
}
