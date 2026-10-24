// Utilidades de texto Markdown compartidas por los generadores de documentación.

export function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function md(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

export function code(value) {
  return `\`${String(value).replace(/\s+/g, ' ').trim().replace(/`/g, '\\`')}\``;
}
