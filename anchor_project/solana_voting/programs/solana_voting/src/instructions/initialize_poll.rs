use anchor_lang::prelude::*;

use crate::errors::VotingError;
use crate::states::*;

pub fn initialize_poll(
    ctx: Context<InitializePoll>,
    poll_id: u64,
    description: String,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    require!(start_time < end_time, VotingError::InvalidTimeRange);
    require!(description.len() <= 280, VotingError::DescriptionTooLong);

    let poll = &mut ctx.accounts.poll;
    poll.poll_id = poll_id;
    poll.description = description;
    poll.start_time = start_time;
    poll.end_time = end_time;
    poll.candidate_count = 0;
    poll.creator = ctx.accounts.creator.key();

    msg!("Poll initialized with ID: {}", poll_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Poll::INIT_SPACE,
        seeds = [POLL_SEED, poll_id.to_le_bytes().as_ref(), creator.key().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
