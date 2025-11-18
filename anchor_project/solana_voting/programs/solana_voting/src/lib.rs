use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("Fsqy1AD1XjnsERPnFSWgdtS6Kk6LsJNuyESoRUEwT7Na");

#[program]
pub mod solana_voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        description: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::initialize_poll(ctx, poll_id, description, start_time, end_time)
    }

    pub fn add_candidate(ctx: Context<AddCandidate>, name: String) -> Result<()> {
        instructions::add_candidate(ctx, name)
    }

    pub fn cast_vote(ctx: Context<CastVote>) -> Result<()> {
        instructions::cast_vote(ctx)
    }
}
