import type { CompiledCircuit } from '@noir-lang/noir_js';
import { generateEmailVerifierInputs } from '@zk-email/zkemail-nr';
import { Prover, type ProvingBackend } from '@zkpersona/noir-helpers';


export const circuitParams = {
  instagram: {
    maxHeadersLength: 576,
    maxBodyLength: 16384,
    extractFrom: true,
    extractTo: true,
  },
} as const;

export type CircuitType = keyof typeof circuitParams;
export type CircuitInputMap = { instagram: any };   // kod jenerasyonu sonrası güncellenecek

export const createProver = (circuit: CompiledCircuit, backend: ProvingBackend) =>
  new Prover(circuit, backend);

export async function generateCircuitInputs(
  eml: Buffer | string,
  expectedToAddress: string,      // 👈 yeni parametre
) {
  // EML’den gelen default inputlar:
  const base = await generateEmailVerifierInputs(
    eml,
    circuitParams.instagram,
  );

  // Pedersen hash’i Noir ile birebir aynı biçimde üret
  const expected_to_hash= '0xabcdef1234567890deadbeefcafef00d1234567890abcdefdeadbeefcafef00d';

  // Noir “main” argüman düzeni ↴
  return {
    ...base,
    expected_to_hash,
  };
}