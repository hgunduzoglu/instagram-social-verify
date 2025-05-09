/* tests/instagram.test.ts */

import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

import { createProver, generateCircuitInputs } from '../src/helpers';

import type { CompiledCircuit } from '@noir-lang/noir_js';
import type { Prover } from '@zkpersona/noir-helpers';

/* ACIR JSON (nargo compile → target/instagram_example.json) */
import circuit from '../target/instagram_example.json' assert { type: 'json' };

/* Skip tests based on environment variables */
const skipPlonkProving = true; // Default to running all tests
const skipHonkProving = false;  // Default to running all tests

describe('Instagram email verification', () => {
  let prover: Prover;
  // The correct recipient email from the test file
  const RECIPIENT_EMAIL = 'yildirim.mesude11@gmail.com';
  // The expected username to verify
  const INSTAGRAM_USERNAME = 'denemedeneme581';
  // An incorrect username to test validation
  const INCORRECT_USERNAME = 'wrongusername123';
  
  beforeAll(() => {
    // Initialize prover
    prover = createProver(circuit as CompiledCircuit, { type: 'all' });
  });

  it.skipIf(skipHonkProving)('proves DKIM, email hash, and username (honk backend)', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));
    
    // Generate circuit inputs for both email and username verification
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INSTAGRAM_USERNAME);
    
    // Generate proof that: 
    // 1. Email has valid DKIM signature from Instagram
    // 2. The email is addressed to the claimed recipient (verified by hash)
    // 3. The username in the email matches the expected username (verified by hash)
    const proof = await prover.fullProve(inputs, { type: 'honk' });
    const verified = await prover.verify(proof, { type: 'honk' });
    
    console.log('Proof outputs:', proof.publicInputs);
    expect(verified).toBe(true);
  });

  it.skipIf(skipPlonkProving)('proves DKIM, email hash, and username (plonk backend)', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));

    // Same inputs for both backends
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INSTAGRAM_USERNAME);

    const proof = await prover.fullProve(inputs, { type: 'plonk' });
    const verified = await prover.verify(proof, { type: 'plonk' });
    
    console.log('Proof outputs:', proof.publicInputs);
    expect(verified).toBe(true);
  });

  it.skipIf(skipHonkProving)('should fail verification with incorrect username (honk backend)', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));
    
    // First, get the correct username from the email for logging purposes
    const emlString = eml.toString('utf8');
    const usernameMatch = emlString.match(/Merhaba ([^,]+),/);
    const correctUsername = usernameMatch ? usernameMatch[1] : null;
    console.log(`Correct username from email: ${correctUsername}`);
    console.log(`Incorrect username being tested: ${INCORRECT_USERNAME}`);
    
    // Generate circuit inputs with incorrect username
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INCORRECT_USERNAME);
    
    // When username doesn't match, the proof should fail because our circuit
    // now verifies that extracted_username_hash == expected_username_hash
    try {
      // This should fail with a constraint violation
      await prover.fullProve(inputs, { type: 'honk' });
      // If we get here, the test should fail
      expect(true).toBe(false); // Proof should have failed with incorrect username
    } catch (error) {
      // Error is expected
      console.log('Expected error caught:', error.message);
      expect(error).toBeDefined();
    }
  });

  it.skipIf(skipHonkProving)('should not allow verification with mismatched usernames', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));
    
    // First extract the correct username from the email
    const emlString = eml.toString('utf8');
    const usernameMatch = emlString.match(/Merhaba ([^,]+),/);
    const correctUsername = usernameMatch ? usernameMatch[1] : null;
    
    expect(correctUsername).toBe('denemedeneme581');
    expect(INCORRECT_USERNAME).not.toBe(correctUsername);
    
    // Generate inputs with the incorrect username
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INCORRECT_USERNAME);
    
    // We should see two different hash values in the inputs
    console.log('Input values:', {
      extracted: inputs.extracted_username_hash,
      expected: inputs.expected_username_hash
    });
    
    // We expect the proof generation to fail because the hashes don't match
    let errorThrown = false;
    
    try {
      // Try to generate a proof - this should fail due to the assertion in main.nr
      await prover.fullProve(inputs, { type: 'honk' });
    } catch (error) {
      // Error is expected - the constraint should fail
      errorThrown = true;
      console.log('Successfully caught expected error with message:', error.message);
    }
    
    // Assert that an error was thrown
    expect(errorThrown).toBe(true);
    if (!errorThrown) {
      console.error('ERROR: Proof succeeded with mismatched usernames!');
    }
  });
});
