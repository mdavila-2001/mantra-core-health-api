const ACCENTED = 'áàâäãéèêëíìîïóòôöõúùûüç';
const PLAIN = 'aaaaaeeeeiiiiooooouuuuc';

export function sqlSearchKey(column: string): string {
  return `translate(lower(${column}), '${ACCENTED}ñ', '${PLAIN}n')`;
}

export function sqlSortKey(column: string): string {
  return `translate(lower(${column}), '${ACCENTED}', '${PLAIN}')`;
}

export function containsPattern(normalized: string): string {
  return `%${normalized.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}
