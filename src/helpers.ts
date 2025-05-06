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
  emailContent: Buffer | string,
) {
  return await generateEmailVerifierInputs(
    emailContent,
    circuitParams.instagram
  );
}
