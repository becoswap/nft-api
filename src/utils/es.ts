const ES_PREFIX = process.env.ES_PREFIX;

export function getEsIndex(index: string): string {
  return ES_PREFIX + index;
}
