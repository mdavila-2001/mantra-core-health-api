import { ConflictException, ResourceNotFoundException } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  DiagnosticServiceCategories,
  DiagnosticStudyOfferings,
} from '../entities';
import { T1, T2, T3, actor, build, draft, inT } from './lab-portal.testing';

describe('LabPortalCategoriesService', () => {
  it('creates, lists by name and counts the services that are not withdrawn', async () => {
    const { catalog, categories } = build();
    const química = await inT(T1, () => categories.create(' Química ', actor));
    const hema = await inT(T1, () => categories.create('Hematología', actor));
    expect(química).toEqual({
      id: expect.any(String),
      name: 'Química',
      serviceCount: 0,
    });
    const a = await inT(T1, () =>
      catalog.create(draft('GLU', { categoryId: química.id }), actor),
    );
    await inT(T1, () =>
      catalog.create(draft('UREA', { categoryId: química.id }), actor),
    );
    await inT(T1, () => catalog.withdraw(a.id, actor));
    const page = await inT(T1, () => categories.list());
    expect(page).toEqual({
      count: 2,
      items: [
        { id: hema.id, name: 'Hematología', serviceCount: 0 },
        { id: química.id, name: 'Química', serviceCount: 1 },
      ],
    });
  });

  it('refuses a name already taken in the lab, ignoring case: 409', async () => {
    const { categories } = build();
    const c = await inT(T1, () => categories.create('Hormonas', actor));
    await expect(
      inT(T1, () => categories.create('hormonas', actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    // The same name in another lab is not a clash.
    await expect(
      inT(T2, () => categories.create('Hormonas', actor)),
    ).resolves.toMatchObject({ name: 'Hormonas' });
    const other = await inT(T1, () => categories.create('Orina', actor));
    await expect(
      inT(T1, () => categories.rename(other.id, 'HORMONAS', actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    // Renaming to its own name in another case is allowed.
    await expect(
      inT(T1, () => categories.rename(c.id, 'HORMONAS', actor)),
    ).resolves.toMatchObject({ id: c.id, name: 'HORMONAS' });
  });

  it('renames and stamps the audit columns', async () => {
    const { em, categories } = build();
    const c = await inT(T1, () => categories.create('Orina', actor));
    const renamed = await inT(T1, () =>
      categories.rename(c.id, ' Uroanálisis ', actor),
    );
    expect(renamed.name).toBe('Uroanálisis');
    const [row] = em.rows(DiagnosticServiceCategories);
    expect(row).toMatchObject({
      name: 'Uroanálisis',
      createdByUserId: actor.id,
      updatedByUserId: actor.id,
    });
  });

  it('isolates labs: another lab’s category is a 404, and a tenant without a lab too', async () => {
    const { categories } = build();
    const foreign = await inT(T2, () => categories.create('Ajena', actor));
    expect((await inT(T1, () => categories.list())).count).toBe(0);
    await expect(
      inT(T1, () => categories.rename(foreign.id, 'x', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      inT(T1, () => categories.remove(foreign.id)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(inT(T3, () => categories.list())).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('keeps a category that still groups live services: 409 with the count', async () => {
    const { em, catalog, categories } = build();
    const c = await inT(T1, () => categories.create('Química', actor));
    await inT(T1, () =>
      catalog.create(draft('GLU', { categoryId: c.id }), actor),
    );
    await expect(inT(T1, () => categories.remove(c.id))).rejects.toMatchObject({
      status: 409,
      details: { serviceCount: 1 },
    });
    expect((await inT(T1, () => categories.list())).count).toBe(1);
    expect(em.rows(DiagnosticStudyOfferings)[0].serviceCategoryId).toBe(c.id);
  });

  it('deletes an empty category, detaching its withdrawn services first', async () => {
    const { em, catalog, categories } = build();
    const c = await inT(T1, () => categories.create('Química', actor));
    const s = await inT(T1, () =>
      catalog.create(draft('GLU', { categoryId: c.id }), actor),
    );
    await inT(T1, () => catalog.withdraw(s.id, actor));
    expect(em.rows(DiagnosticStudyOfferings)[0].statusConceptId).toBe(
      DUNIT.OFFERING_RETIRED,
    );
    await expect(inT(T1, () => categories.remove(c.id))).resolves.toEqual({
      ok: true,
    });
    expect((await inT(T1, () => categories.list())).count).toBe(0);
    expect(
      em.rows(DiagnosticStudyOfferings)[0].serviceCategoryId,
    ).toBeUndefined();
  });
});
