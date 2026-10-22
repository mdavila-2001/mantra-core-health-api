import { LockMode } from '@mikro-orm/core';
import { ProfessionalCredentialsRepository } from './professional-credentials.repository';

/**
 * El repositorio de credenciales profesionales — que lo que se le pasa, llegue.
 *
 * ## Por qué existe este archivo
 *
 * `create()` **no reenvía el objeto que recibe**: arma uno nuevo campo por
 * campo, así que cualquier dato que el llamador agregue y este método no nombre
 * **se descarta en silencio**. No falla, no avisa: la fila se escribe sin él.
 *
 * Es el mismo defecto que costó una verificación en `AppointmentsRepository`
 * con el canal de teleconsulta, y volvió a asomar acá al sumar el archivo del
 * diploma: el spec del servicio pasaba —asevera sobre el mock del repositorio,
 * y el mock sí recibía `fileId`— pero borrar la línea del repositorio no ponía
 * nada en rojo. La prueba miraba el borde equivocado.
 *
 * Acá se prueba el borde que faltaba: que cada campo del contrato sobrevive el
 * traspaso a `em.create`. Sólo vale si se agrega una línea por cada campo
 * nuevo, y por eso el fallo dice cuál se perdió.
 */
describe('ProfessionalCredentialsRepository', () => {
  /** Un `EntityManager` que sólo recuerda con qué lo llamaron. */
  function rememberingEm() {
    const calls: Record<string, unknown>[] = [];
    return {
      llamadas: calls,
      em: {
        create: (entity: unknown, data: Record<string, unknown>) => {
          calls.push(data);
          return data;
        },
      } as never,
    };
  }

  const base = {
    practitionerProfileId: 'pp-1',
    credentialTypeConceptId: 'cred-type-diploma',
    number: 'DIP-2024-17',
    stateConceptId: 'cred-pending',
  };

  it('el archivo del diploma llega a la fila', () => {
    const { em, llamadas: calls } = rememberingEm();

    new ProfessionalCredentialsRepository().create(em, {
      ...base,
      fileId: 'file-1',
    });

    expect(calls[0].fileId).toBe('file-1');
  });

  it('sin archivo la fila no lo inventa', () => {
    const { em, llamadas: calls } = rememberingEm();

    new ProfessionalCredentialsRepository().create(em, base);

    expect(calls[0].fileId).toBeUndefined();
  });

  it('los campos que ya existían siguen llegando', () => {
    const { em, llamadas: calls } = rememberingEm();
    const issuance = new Date('2024-03-15');

    new ProfessionalCredentialsRepository().create(em, {
      ...base,
      issuingInstitutionText: 'Universidad Gabriel René Moreno',
      issueDate: issuance,
      verificationSourceUri: 'https://registro.test/dip/17',
    });

    const row = calls[0];
    expect(row.practitionerProfileId).toBe('pp-1');
    expect(row.credentialTypeConceptId).toBe('cred-type-diploma');
    expect(row.number).toBe('DIP-2024-17');
    expect(row.issuingInstitutionText).toBe('Universidad Gabriel René Moreno');
    expect(row.issueDate).toBe(issuance);
    expect(row.verificationSourceUri).toBe('https://registro.test/dip/17');
    expect(row.stateConceptId).toBe('cred-pending');
  });

  it('lee la credencial con bloqueo de escritura antes de cambiar su estado', async () => {
    const repository = new ProfessionalCredentialsRepository();
    const calls: unknown[][] = [];
    const row = { id: 'cred-1' };
    const em = {
      findOne: (...args: unknown[]) => {
        calls.push(args);
        return Promise.resolve(row);
      },
    } as never;
    const findByIdForUpdate: unknown = Reflect.get(
      repository,
      'findByIdForUpdate',
    );
    expect(typeof findByIdForUpdate).toBe('function');
    if (typeof findByIdForUpdate !== 'function') return;

    await expect(
      Promise.resolve(
        Reflect.apply(findByIdForUpdate, repository, [em, 'cred-1']),
      ),
    ).resolves.toBe(row);

    expect(calls[0]?.[1]).toEqual({ id: 'cred-1' });
    expect(calls[0]?.[2]).toEqual({ lockMode: LockMode.PESSIMISTIC_WRITE });
  });
});
