import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que marca una ruta como abierta al paciente en cualquier organización. */
export const PATIENT_ANY_TENANT_KEY = 'patientAnyTenant';

/**
 * Deja que un paciente declare en `X-Tenant-Id` **cualquier** organización, no
 * sólo aquellas de las que tiene membresía.
 *
 * El registro de un paciente sólo lo afilia a la organización por defecto, pero
 * pedir una cita es algo que hace con cualquier organización: la que tiene a su
 * profesional, a su laboratorio o a su centro. Sin esta marca, la resolución
 * ordinaria del tenant respondía 403 `TENANT_MEMBERSHIP_REQUIRED` en cuanto el
 * paciente declaraba una organización que no era la suya, y «Mis citas» sólo
 * podía ofrecer los horarios de esa única organización.
 *
 * La marca sólo abre la **resolución** del tenant, y sólo para quien tiene el
 * rol `PATIENT`; el rol sigue evaluándose contra el tenant resuelto, el
 * aislamiento por RLS sigue acotando cada lectura a ese tenant, y el resto de
 * reglas de la ruta (propiedad de la reserva, vínculos, políticas) no cambian.
 *
 * **Se usa con cuentagotas**: sólo en las rutas del flujo de agendar y de
 * seguir las propias citas. Cualquier otra ruta sigue exigiendo membresía.
 */
export const PatientAnyTenant = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PATIENT_ANY_TENANT_KEY, true);
