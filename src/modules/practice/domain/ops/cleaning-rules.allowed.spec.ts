import { describe, expect, it } from '@jest/globals';
import {
  allowedCleaningActions,
  cleaningInspectionRequired,
} from './cleaning-rules';

describe('transiciones permitidas de una orden de limpieza', () => {
  it('por estado: pendiente admite asignar, iniciar y cancelar; terminada, inspeccionar y cancelar', () => {
    expect(allowedCleaningActions('CLN_PENDING')).toEqual([
      'assign',
      'start',
      'cancel',
    ]);
    expect(allowedCleaningActions('CLN_DONE')).toEqual(['inspect', 'cancel']);
    expect(allowedCleaningActions('CLN_INSPECTED')).toEqual([]);
  });
  it('fail-closed por permiso: sin el permiso de la transición no se ofrece', () => {
    const onlyWork = (p: string) => p === 'f2.cleaning.work';
    expect(allowedCleaningActions('CLN_PENDING', onlyWork)).toEqual(['start']);
    expect(allowedCleaningActions('CLN_DONE', onlyWork)).toEqual([]);
    expect(allowedCleaningActions('CLN_DONE', () => false)).toEqual([]);
  });
  it('inspección exigida: terminal o por ajuste de la práctica', () => {
    expect(
      cleaningInspectionRequired({
        terminal: true,
        settingsInspectionRequired: false,
      }),
    ).toBe(true);
    expect(
      cleaningInspectionRequired({
        terminal: false,
        settingsInspectionRequired: true,
      }),
    ).toBe(true);
    expect(
      cleaningInspectionRequired({
        terminal: false,
        settingsInspectionRequired: false,
      }),
    ).toBe(false);
  });
});
