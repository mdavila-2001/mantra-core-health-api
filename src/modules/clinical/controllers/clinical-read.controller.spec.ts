import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ACCESS_LOGGED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { ClinicalRecordAccessGuard } from '../guards';
import { ClinicalReadController } from './clinical-read.controller';

/**
 * Contrato de montaje de «Servicios recibidos»: es PHI de un paciente, así que la
 * ruta tiene que pasar por el guard de acceso a la historia y dejar su asiento de
 * lectura. Se lee la metadata que Nest usa al arrancar, no se llama al método:
 * llamarlo con `new` nunca ejecuta el guard.
 */
const handler = (name: string): ((...args: never[]) => unknown) =>
  Object.getOwnPropertyDescriptor(ClinicalReadController.prototype, name)!
    .value;

describe('ClinicalReadController · servicios recibidos', () => {
  it('es un GET con el paciente en la ruta', () => {
    const fn = handler('getReceivedServices');
    expect(Reflect.getMetadata(METHOD_METADATA, fn)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, fn)).toBe(
      ':patientProfileId/received-services',
    );
  });

  it('pasa por el mismo guard de la historia que el resumen', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ClinicalReadController,
    ) as unknown[];
    expect(guards).toContain(ClinicalRecordAccessGuard);
  });

  it('deja el asiento de lectura del paciente de la ruta', () => {
    expect(
      Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('getReceivedServices')),
    ).toEqual({
      resourceType: 'RECEIVED_SERVICES',
      patient: 'param:patientProfileId',
    });
  });

  it('lo leen quienes atienden y el propio paciente', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ClinicalReadController)).toEqual(
      expect.arrayContaining(['CLINICIAN', 'PRACTITIONER', 'PATIENT']),
    );
  });
});
