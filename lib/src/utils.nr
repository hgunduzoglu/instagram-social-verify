pub struct VerifiedOutputs {
    pub_key_hash: Field,
    email_nullifier: Field,
    to_address: BoundedVec<u8, 320>,
}

impl VerifiedOutputs {
    pub fn new(pk: Field, nul: Field, to: BoundedVec<u8, 320>) -> Self {
        Self { pub_key_hash: pk, email_nullifier: nul, to_address: to }
    }
}