import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { CreateQuestionScriptDto } from './create-question-script.dto';
import { UpdateQuestionScriptDto } from './update-question-script.dto';
import { CreateFaqDto } from './create-faq.dto';
import { ReorderFaqsDto } from './reorder-faqs.dto';

/** Bodies of the question-script and FAQ routes against the global pipe. */
describe('Question script and FAQ DTOs', () => {
  const pipe = createGlobalValidationPipe();
  const parse = (metatype: ArgumentMetadata['metatype'], body: unknown) =>
    pipe.transform(body, { type: 'body', metatype });

  const item = (over: Record<string, unknown> = {}) => ({
    questionText: '¿Fuma?',
    answerType: 'yes_no',
    required: true,
    ...over,
  });
  const script = (items: unknown[]) => ({ title: 'Primera consulta', items });

  it('accepts a script with free questions and a choice with options', async () => {
    const dto = await parse(
      CreateQuestionScriptDto,
      script([
        item(),
        item({ answerType: 'single_choice', options: ['Sí', 'No'] }),
      ]),
    );
    expect(dto).toBeInstanceOf(CreateQuestionScriptDto);
  });

  it.each([
    ['missing options on a choice', { answerType: 'single_choice' }],
    ['a single option', { answerType: 'multiple_choice', options: ['A'] }],
    ['a blank option', { answerType: 'single_choice', options: ['A', ' '] }],
    [
      'repeated options (trim, case-insensitive)',
      { answerType: 'single_choice', options: ['Sí', ' sí '] },
    ],
    ['options on a non-choice', { answerType: 'number', options: ['1', '2'] }],
    ['an unknown answer type', { answerType: 'scale' }],
    ['required as a string', { required: 'true' }],
    ['a blank question', { questionText: '   ' }],
  ])('rejects %s with 400', async (_label, over) => {
    await expect(
      parse(CreateQuestionScriptDto, script([item(over)])),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects zero and more than 100 items', async () => {
    await expect(
      parse(CreateQuestionScriptDto, script([])),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parse(
        CreateQuestionScriptDto,
        script(Array.from({ length: 101 }, () => item())),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parse(
        CreateQuestionScriptDto,
        script(Array.from({ length: 100 }, () => item())),
      ),
    ).resolves.toBeInstanceOf(CreateQuestionScriptDto);
  });

  it('PATCH requires version and leaves the rest optional', async () => {
    await expect(
      parse(UpdateQuestionScriptDto, { title: 'X' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parse(UpdateQuestionScriptDto, { version: 3 }),
    ).resolves.toMatchObject({ version: 3 });
  });

  it('FAQ rejects markup and unknown properties', async () => {
    await expect(
      parse(CreateFaqDto, { question: '<b>x</b>', answer: 'y' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parse(CreateFaqDto, { question: 'x', answer: 'y', position: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reorder rejects repeated or non-uuid ids', async () => {
    const id = '0b6f1f0e-4c1d-4c8a-9a51-2f6f2c0b7c11';
    await expect(
      parse(ReorderFaqsDto, { ids: [id, id] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(parse(ReorderFaqsDto, { ids: ['x'] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
