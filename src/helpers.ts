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

// Simple hash function to match the Noir implementation
// We simply sum the bytes multiplied by their position (i+1)
function simpleHash(data: Uint8Array): bigint {
  let sum = BigInt(0);
  for (let i = 0; i < data.length; i++) {
    sum += BigInt(data[i]) * BigInt(i + 1);
  }
  return sum;
}

export async function generateCircuitInputs(
  eml: Buffer | string,
  expectedToAddress: string,      // Still take the email address as input
) {
  // Get the basic inputs from the email
  const base = await generateEmailVerifierInputs(
    eml,
    circuitParams.instagram,
  );

  // Calculate hash of the expected email address using the same algorithm as in Noir
  const textEncoder = new TextEncoder();
  const emailData = textEncoder.encode(expectedToAddress);
  const emailHash = simpleHash(emailData);
  
  console.log('Expected email:', expectedToAddress);
  console.log('Email hash value:', emailHash.toString());
  
  // Noir "main" argüman düzeni ↴
  return {
    ...base,
    expected_to_hash: emailHash.toString()  // Pass the hash as a string
  };
}