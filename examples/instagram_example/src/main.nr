use instagram_sv::{
    constants::{
        MAX_EMAIL_HEADER_LENGTH,     
    },
    instagram::verify_instagram_email,
    utils::VerifiedOutputs,
};
use zkemail::{ dkim::RSAPubkey, KEY_LIMBS_1024, Sequence };

fn main(
    header:  BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey:  RSAPubkey<KEY_LIMBS_1024>,
    signature: [Field; KEY_LIMBS_1024],
    from_header_sequence: Sequence,
    from_address_sequence: Sequence,
    to_header_sequence:   Sequence,
    to_address_sequence:  Sequence,
    expected_to_hash: Field,      // Hash of user's email to verify
    expected_username_hash: Field, // Hash of user's Instagram username to verify
) -> pub VerifiedOutputs {

    verify_instagram_email(
        header,  pubkey,  signature,
        from_header_sequence, from_address_sequence,
        to_header_sequence,   to_address_sequence,
        expected_to_hash,
        expected_username_hash           
    )
}
