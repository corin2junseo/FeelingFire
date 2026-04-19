/**
 * Credit cost calculation (shared between server and client).
 * 1 min → 1 credit, 2 min → 2 credits, 3 min → 3 credits
 * total = durationCredits × batchSize
 */
export function calcCreditCost(durationSecs: number, batchSize: number): number {
  const durationCredits = durationSecs === 120 ? 2 : durationSecs === 180 ? 3 : 1
  return durationCredits * batchSize
}
