import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
// en üstte ekle
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { poseidon2 } from "poseidon-lite";

// __dirname benzeri bir değişken yarat
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Noir ve Barretenberg
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";

// Helper: .eml'den circuit input'larını üretir
import { generateCircuitInputs } from "./helpers.js";

async function loadCircuit() {
    // eski: path.resolve(__dirname, "../examples/instagram_example/target/instagram_example.json")
    const acirPath = join(
      __dirname,
      "..",        // backend klasörünün üstü
      "target",
      "instagram_example.json"
    );
    return JSON.parse(fs.readFileSync(acirPath, "utf8"));
  }

async function main() {
  const app = express();
  app.use(bodyParser.json({ limit: "10mb" })); // büyük .eml'ler için izin ver

  // Add CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Circuit + backend'i yükle
  const circuit = await loadCircuit();
  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);

  /**
   * Beklenen POST gövdesi:
   * {
   *   emlBase64: "<.eml dosyasının base64 string'i>",
   *   expectedEmail: "yildirim.mesude11@gmail.com",
   *   expectedUsername: "denemedeneme581"
   * }
   */
  app.post("/verify", async (req, res) => {
    try {
      const { emlBase64, expectedEmail, expectedUsername } = req.body;
      const emlBuffer = Buffer.from(emlBase64, "base64");

      // 1) Circuit input'larını üret
      const inputs = await generateCircuitInputs(
        emlBuffer,
        expectedEmail,
        expectedUsername
      );
      // inputs: { header, pubkey, signature, …, expected_username_hash }

      // 2) Witness üret
      const { witness } = await noir.execute(inputs);

      // 3) Proof üret & doğrula
      const proof = await backend.generateProof(witness);
      const isValid = await backend.verifyProof(proof);
      if (!isValid) {
        return res.status(400).json({ error: "Proof doğrulaması başarısız." });
      }

      // 4) Leaf hash üret (Poseidon)
      const a = BigInt(inputs.expected_to_hash);
      const b = BigInt(inputs.extracted_username_hash);
      const c = BigInt(inputs.expected_username_hash);

      const h1 = poseidon2([a, b]);
      const h2 = poseidon2([h1, c]);

      const leafHash = "0x" + h2.toString(16);


      // 5) (Opsiyonel) Merkle ağacına ekleme -> newRoot, merkleProof
      //    Burada kendi Merkle Tree kodunu çağırıp döneceksin.

      return res.json({
        success: true,
        leafHash,
        // newRoot,
        // merkleProof
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`🛰️  Backend is working on : http://localhost:${PORT}`)
  );
}

main().catch(console.error);
//comment