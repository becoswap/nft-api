import { CHAIN_ID } from '../constants';

export function getEsIndex(index: string): string {
  return String(CHAIN_ID) + '_' + index;
}
