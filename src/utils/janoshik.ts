export const normalizeJanoshikKey = (value: string | null | undefined): string => {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const key = url.searchParams.get('key');
    if (key) return key.trim();
  } catch {
    // Not a full URL, fall through to pattern matching
  }

  const match = raw.match(/(?:^|[?&])key=([^&]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  return raw;
};

export const buildJanoshikVerifyUrl = (value: string | null | undefined): string => {
  const key = normalizeJanoshikKey(value);
  if (!key) return 'https://janoshik.com/verification/';
  return `https://janoshik.com/verification/?key=${encodeURIComponent(key)}`;
};
