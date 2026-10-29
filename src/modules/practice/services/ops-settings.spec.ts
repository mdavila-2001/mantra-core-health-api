import { DEFAULT_INFRA_SETTINGS, OpsSettingsReader } from './ops-settings';
import { fn } from './ops.testing';

const leer = (rows: { setting_key: string; value_json: unknown }[]) =>
  new OpsSettingsReader().forSite(
    { execute: fn().mockResolvedValue(rows) } as any,
    'site-1',
  );

describe('OpsSettingsReader · infra.* es dato, no constante', () => {
  it('sin filas devuelve los valores por omisión: inspección obligatoria y HVAC de 365 días', async () => {
    expect(await leer([])).toEqual(DEFAULT_INFRA_SETTINGS);
    expect(DEFAULT_INFRA_SETTINGS).toMatchObject({
      inspectionRequired: true,
      hvacValidationMaxDays: 365,
      aiirMinAirChanges: null,
    });
  });

  it('lee el valor directo o envuelto en { value } y descarta lo inválido', async () => {
    const s = await leer([
      {
        setting_key: 'infra.inspection_required',
        value_json: { value: false },
      },
      { setting_key: 'infra.hvac_validation_max_days', value_json: 90 },
      { setting_key: 'infra.aiir_min_air_changes', value_json: '12' },
      {
        setting_key: 'infra.cleaning_due_minutes',
        value_json: { CLN_PRIO_STAT: 15, CLN_PRIO_ROUTINE: -3 },
      },
    ]);
    expect(s).toEqual({
      inspectionRequired: false,
      hvacValidationMaxDays: 90,
      aiirMinAirChanges: 12,
      cleaningDueMinutes: { CLN_PRIO_STAT: 15 },
    });
    const malo = await leer([
      { setting_key: 'infra.inspection_required', value_json: 'quizás' },
      { setting_key: 'infra.hvac_validation_max_days', value_json: 'x' },
    ]);
    expect(malo).toEqual(DEFAULT_INFRA_SETTINGS);
  });
});
