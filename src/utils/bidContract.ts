import exchangeContracts from '../data/exchangeContracts';

export const isBidContract = addr => {
  return !!exchangeContracts.find(c => c.address === addr);
};
