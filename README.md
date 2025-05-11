# Instagram Social Verify Backend

**Instagram Social Verify** is a zk-proof–based service that confirms an Instagram-sent email (.eml) is authentic (unaltered and genuinely from Instagram) and that it matches a user’s claimed email address and Instagram username. Without ever storing the raw `.eml` file, the system:

1. **Verifies DKIM signature** to prove the email headers and body have not been tampered with and originate from `security@mail.instagram.com`.
2. **Checks recipient** by hashing the “To” address inside the email and comparing it to the user’s provided email.
3. **Validates username** by extracting or hashing the Instagram username in the email body and matching it against the claimed username.
4. **Generates a zero-knowledge proof** via a Noir circuit and Barretenberg backend, ensuring privacy of the user’s email and username while producing a succinct `leafHash` output.

This `leafHash` can then be used as an on‑chain Merkle tree leaf or stored in your backend database / JWT for later verification of Instagram account ownership.

---

## Prerequisites

* **Node.js** (v16 or higher recommended)
* **npm** (comes with Node.js)
* *(Optional for dev)* **nodemon** for hot-reloading on code changes

## Repository Layout

```
instagram-social-verify/
├── backend/                     # This README pertains to this folder
│   ├── index.js                 # Express server handling zk-proof verification
│   ├── helpers.js               # Converts .eml + user inputs into circuit inputs
│   ├── package.json             # Backend npm configuration
│   └── ...                      # Additional backend scripts
├── examples/                    # Noir circuit definitions and compiled artifacts
│   └── instagram_example/
│       └── target/
│           └── instagram_example.json  # ACIR for the circuit
├── src/                         # Frontend-related helpers & code
└── ...                          # Other project files
```

## Installation

From the **project root**:

```bash
cd instagram-social-verify
cd backend
npm install
```

To enable automatic restarts during development, install nodemon (global or dev-dependency):

```bash
npm install --save-dev nodemon
```

## Configuration

No environment variables are required by default. If you add JWT or database support later, create a `.env` file in the `backend` directory.

## Running the Server

### Development Mode

```bash
npm run dev
```

*Launches Express with nodemon; server restarts on file change.*

### Production Mode

```bash
npm start
```

The service listens on **[http://localhost:3001](http://localhost:3001)** by default.

## API Endpoint: POST `/verify`

Performs email authenticity and username ownership verification via a zk-proof.

### Request JSON

```json
{
  "emlBase64": "<Instagram .eml file encoded as base64>",
  "expectedEmail": "user@example.com",
  "expectedUsername": "instagram_handle"
}
```

* `emlBase64`: Base64 string of the raw `.eml` file sent by Instagram
* `expectedEmail`: The user’s email address (to match the To: header)
* `expectedUsername`: The Instagram username to confirm embedded in the email body

### Success Response

* **Status**: `200 OK`
* **Body**:

  ```json
  {
    "success": true,
    "leafHash": "0xabcdef123456..."
  }
  ```

`leafHash` is a Poseidon Merkle leaf representing the verified proof outputs; you can store it in your user record or include it in a JWT for later checks.

### Error Responses

* **400 Bad Request**: Proof verification failed or input validation error.
* **500 Internal Server Error**: Unexpected server exception.

## Local Testing

Use `curl`, HTTPie, or Postman to simulate frontend consumption:

```bash
# Step 1: Encode your .eml
EML_B64=$(base64 -w 0 path/to/instagram-valid.eml)

# Step 2: Send verification request
curl http://localhost:3001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "emlBase64": "'"${EML_B64}"'",
    "expectedEmail": "yildirim.mesude11@gmail.com",
    "expectedUsername": "denemedeneme581"
  }'
```

A successful call returns `success: true` and a `leafHash` you can persist.

## Frontend Integration Steps

1. **File reading**: Use `FileReader` or `arrayBuffer()` in your UI to load the `.eml` file. Convert it to base64 (`btoa`).
2. **API call**: POST the `emlBase64`, `expectedEmail`, and `expectedUsername` to `/verify`.
3. **Handle response**:

   * On success, save `leafHash` in your user state, local storage, or pass into your session token.
   * Clear any temporary `.eml` data to avoid storing sensitive email content.
4. **Subsequent flows**:

   * Use the stored `leafHash` to prove Instagram account ownership in future requests or on-chain Merkle proofs.

---


