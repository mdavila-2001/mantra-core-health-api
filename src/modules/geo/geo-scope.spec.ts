import { PreconditionFailedException } from '../../common';
import { assertGeofenceSubjectSameTenant } from './geo-scope';
import { GeoErrorReason } from './geo.error-reasons';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

describe('assertGeofenceSubjectSameTenant (GEO-02)', () => {
  it('accepts geofence and subject of the same tenant', () => {
    expect(() =>
      assertGeofenceSubjectSameTenant({ tenantId: T1 }, { tenantId: T1 }),
    ).not.toThrow();
  });

  it('rejects T1 geofence with T2 subject (422 GEO_GEOFENCE_SUBJECT_TENANT_MISMATCH)', () => {
    let error: any;
    try {
      assertGeofenceSubjectSameTenant({ tenantId: T1 }, { tenantId: T2 });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getStatus()).toBe(422);
    expect(error.code).toBe('PRECONDITION_FAILED');
    expect(error.reason).toBe(GeoErrorReason.GEOFENCE_SUBJECT_TENANT_MISMATCH);
  });

  it('rejects a subject or geofence without tenant', () => {
    expect(() => assertGeofenceSubjectSameTenant({ tenantId: T1 }, {})).toThrow(
      PreconditionFailedException,
    );
    expect(() => assertGeofenceSubjectSameTenant({}, { tenantId: T1 })).toThrow(
      PreconditionFailedException,
    );
  });
});
