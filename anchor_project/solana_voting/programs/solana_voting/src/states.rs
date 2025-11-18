use anchor_lang::prelude::*;

pub const POLL_SEED: &[u8] = b"poll";
pub const CANDIDATE_SEED: &[u8] = b"candidate";
pub const VOTE_SEED: &[u8] = b"vote";

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub candidate_count: u64,
    pub creator: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub candidate_id: u64,
    pub poll_id: u64,
    #[max_len(50)]
    pub name: String,
    pub vote_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VoteReceipt {
    pub voter: Pubkey,
    pub candidate_id: u64,
    pub poll_id: u64,
    pub timestamp: i64,
}
