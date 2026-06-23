/** Remove near-duplicate points (within eps) — cross-sections often double up at shared vertices. */
export function dedupePoints(points: number[][], eps: number = 1e-6): number[][] {
  const out: number[][] = [];
  for (const p of points) {
    const isDup = out.some(
      (q) => q.length === p.length && q.every((v, i) => Math.abs(v - p[i]) < eps),
    );
    if (!isDup) out.push(p);
  }
  return out;
}
