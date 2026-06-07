export function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64url');
}

export function fromBase64Url(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf-8');
}
