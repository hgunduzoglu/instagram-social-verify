use std::hash::pedersen_hash;       
use zkemail::{
    dkim::RSAPubkey,
    headers::email_address::get_email_address,
    KEY_LIMBS_1024,
    Sequence,
};

use crate::constants::{MAX_EMAIL_HEADER_LENGTH, INSTAGRAM_FROM_EMAIL};
use super::utils::VerifiedOutputs;

#[export]
pub fn verify_instagram_email(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey:  RSAPubkey<KEY_LIMBS_1024>,
    signature: [Field; KEY_LIMBS_1024],
    from_header_sequence: Sequence,
    from_address_sequence: Sequence,
    to_header_sequence:   Sequence,
    to_address_sequence:  Sequence,


    expected_to: BoundedVec<u8, 320>,
) -> VerifiedOutputs {
    // 1. DKIM
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH, "Header too long");
    pubkey.verify_dkim_signature(header, signature);


    let from = comptime { "from".as_bytes() };
    let to   = comptime { "to".as_bytes()   };

    let from_addr = get_email_address(header,
        from_header_sequence, from_address_sequence, from);
    assert(
        from_addr.eq(BoundedVec::from(INSTAGRAM_FROM_EMAIL)),
        "Unexpected From address",
    );

    let to_addr = get_email_address(header,
        to_header_sequence, to_address_sequence, to);

    assert(to_addr.eq(expected_to), "E-posta adresi uyuşmuyor");

    VerifiedOutputs::new(
        pubkey.hash(),                 // pub_key_hash
        pedersen_hash(signature),      // email_nullifier
        to_addr,                     
    )
}
