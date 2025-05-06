import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CompiledCircuit } from '@noir-lang/noir_js';
import { createProver, generateCircuitInputs } from '../src';

import circuit from '../target/instagram_example.json' assert { type: 'json' };
import type { Prover } from '@zkpersona/noir-helpers';

describe('Instagram email verification', () => {
  let prover: Prover;

  beforeAll(() => {
    prover = createProver(circuit as CompiledCircuit, { type: 'all' });
  });

  it('proves & verifies', async () => {
    const eml = readFileSync(path.join(__dirname, '../data/instagram-valid.eml'));
    const inputs = await generateCircuitInputs(eml);

    for (const backend of ['honk', 'plonk'] as const) {
      const proof = await prover.fullProve(inputs, { type: backend });
      expect(await prover.verify(proof, { type: backend })).toBe(true);
    }
  });
});
