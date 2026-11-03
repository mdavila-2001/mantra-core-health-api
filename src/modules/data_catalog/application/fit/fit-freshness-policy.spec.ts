import {
  PROBE_INTERVAL_MS,
  SCAN_LEASE_SECONDS,
} from '../../domain/catalog/catalog.constants';
import { scanFreshnessThresholdMs } from './fit.constants';

describe('frescura operativa del escaneo', () => {
  it('permite dos intervalos más el cierre de un lease por omisión', () => {
    expect(scanFreshnessThresholdMs()).toBe(
      2 * PROBE_INTERVAL_MS + SCAN_LEASE_SECONDS * 1000,
    );
  });
  it('admite una ventana operativa explícita hasta un día', () => {
    expect(scanFreshnessThresholdMs('3600')).toBe(3_600_000);
    expect(scanFreshnessThresholdMs('86400')).toBe(86_400_000);
  });
  it.each(['', '0', '-1', '1.5', 'Infinity', 'NaN', '100', '86401'])(
    'rechaza %s para no ocultar atrasos ni declarar caído un escaneo todavía en vuelo',
    (value) => {
      expect(() => scanFreshnessThresholdMs(value)).toThrow(
        'CATALOG_SCAN_STALE_AFTER_SECONDS',
      );
    },
  );
});
