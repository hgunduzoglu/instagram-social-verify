use std::hash::pedersen_hash;       
use zkemail::{
    dkim::RSAPubkey,
    headers::email_address::get_email_address,
    KEY_LIMBS_1024,
    Sequence,
};

use crate::constants::{MAX_EMAIL_HEADER_LENGTH, INSTAGRAM_FROM_EMAIL};
use super::utils::VerifiedOutputs;

// Maximum length for an email address
global MAX_EMAIL_LENGTH: u32 = 320;

#[export]
pub fn verify_instagram_email(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey:  RSAPubkey<KEY_LIMBS_1024>,
    signature: [Field; KEY_LIMBS_1024],
    from_header_sequence: Sequence,
    from_address_sequence: Sequence,
    to_header_sequence:   Sequence,
    to_address_sequence:  Sequence,
    expected_to_hash: Field,
) -> VerifiedOutputs {
    // 1. DKIM
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH, "Header too long");
    pubkey.verify_dkim_signature(header, signature);

    let from = comptime { "from".as_bytes() };
    let to   = comptime { "to".as_bytes()   };

    // 2. Verify FROM address is from Instagram
    let from_addr = get_email_address(header,
        from_header_sequence, from_address_sequence, from);
    assert(
        from_addr.eq(BoundedVec::from(INSTAGRAM_FROM_EMAIL)),
        "Unexpected From address",
    );

    // 3. Extract TO address and compute its hash
    let to_addr = get_email_address(header,
        to_header_sequence, to_address_sequence, to);
    
    // Simple hash function - sum the bytes and convert to a Field
    let mut sum: Field = 0;
    let actual_len = to_addr.len();
    
    for i in 0..320 {
        if (i as u32) < actual_len {
            sum += (to_addr.storage[i] as Field) * ((i + 1) as Field);
        }
    }
    
    // Verify the hash matches the expected hash
    assert(sum == expected_to_hash, "Recipient email hash doesn't match expected hash");

    VerifiedOutputs::new(
        pubkey.hash(),                 // pub_key_hash
        pedersen_hash(signature),      // email_nullifier
        sum                            // to_address_hash
    )
}
