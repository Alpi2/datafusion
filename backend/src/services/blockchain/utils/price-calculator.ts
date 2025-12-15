/**
 * Bonding curve math utilities
 * price = k * supply^2, integrals used to compute buy/sell costs
 * Note: Uses JavaScript numbers; for production use a fixed-point library.
 */

const K = 0.0001; // k constant

export function calculateBuyPrice(currentSupply: number, amount: number) {
  const cs = Number(currentSupply || 0);
  const a = Number(amount || 0);
  const newSupply = cs + a;
  // integral k * x^2 dx = k * x^3 / 3
  const cost = (K * (Math.pow(newSupply, 3) - Math.pow(cs, 3))) / 3;
  return cost;
}

export function calculateSellRefund(currentSupply: number, amount: number) {
  const cs = Number(currentSupply || 0);
  const a = Number(amount || 0);
  const newSupply = cs - a;
  if (newSupply < 0) throw new Error("Insufficient supply");
  const refund = (K * (Math.pow(cs, 3) - Math.pow(newSupply, 3))) / 3;
  return refund;
}

export default { calculateBuyPrice, calculateSellRefund };
