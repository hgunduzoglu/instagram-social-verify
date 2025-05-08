/* tests/instagram.test.ts */

import { beforeAll, describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createProver, generateCircuitInputs } from '../src/helpers';

import type { CompiledCircuit } from '@noir-lang/noir_js';
import type { Prover } from '@zkpersona/noir-helpers';

/* ACIR JSON (nargo compile → target/instagram_example.json) */
import circuit from '../target/instagram_example.json' assert { type: 'json' };

/* Parametreli testleri kolay kapatıp açmak istersek */
const skipPlonkProving = process.env.PROVE_PLONK === 'false';
const skipHonkProving  = process.env.PROVE_HONK  === 'false';

describe('Instagram email verification', () => {
  let prover: Prover;

  beforeAll(() => {
    // “all” => ilk çağrıda honk & plonk backend artefaktlarını derler
    const threads = os.cpus().length;
    prover = createProver(circuit as CompiledCircuit, { type: 'all', threads });
  });

  it.skipIf(skipHonkProving)('proves & verifies (honk backend)', async () => {
    const eml = readFileSync(path.join(__dirname, '../data/instagram-valid.eml'));
    const inputs = await generateCircuitInputs(eml, 'instagram');

    const proof = await prover.fullProve(inputs, { type: 'honk' });
    const ok    = await prover.verify(proof,    { type: 'honk' });
    expect(ok).toBe(true);
  });

  it.skipIf(skipPlonkProving)('proves & verifies (plonk backend)', async () => {
    const eml = readFileSync(path.join(__dirname, '../data/instagram-valid.eml'));
    const inputs = await generateCircuitInputs(eml, 'instagram');

    const proof = await prover.fullProve(inputs, { type: 'plonk' });
    const ok    = await prover.verify(proof,    { type: 'plonk' });
    expect(ok).toBe(true);
  });
});
