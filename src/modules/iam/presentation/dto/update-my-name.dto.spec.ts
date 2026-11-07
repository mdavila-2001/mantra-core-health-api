import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMyNameDto } from './update-my-name.dto';

const check = async (body: object): Promise<string[]> =>
  (await validate(plainToInstance(UpdateMyNameDto, body))).map(
    (e) => e.property,
  );

describe('UpdateMyNameDto', () => {
  it('accepts accented, compound and apostrophe names, and empty optional parts', async () => {
    expect(
      await check({
        name: 'María José',
        middleName: '',
        lastName: "O'Brien-Núñez",
        motherLastName: '',
      }),
    ).toEqual([]);
  });

  it('rejects digits, control and invisible characters', async () => {
    expect(await check({ name: 'Wendy1', lastName: 'Dávila' })).toEqual([
      'name',
    ]);
    expect(await check({ name: 'Wendy', lastName: 'Dá\u200Bvila' })).toEqual([
      'lastName',
    ]);
    expect(
      await check({
        name: 'Wendy',
        middleName: 'Je\nnyfer',
        lastName: 'Dávila',
      }),
    ).toEqual(['middleName']);
  });

  it('requires the given name and the paternal surname', async () => {
    expect((await check({})).sort()).toEqual(['lastName', 'name']);
  });
});
