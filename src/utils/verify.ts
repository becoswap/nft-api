import { verifyMessage } from '@ethersproject/wallet';

export async function verify(address, msg, sig) {
  const recovered = await verifyMessage(msg, sig);
  return recovered === address;
}
