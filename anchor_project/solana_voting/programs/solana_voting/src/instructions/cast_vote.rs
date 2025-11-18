use anchor_lang::prelude::*;

use crate::errors::VotingError;
use crate::states::*;

pub fn cast_vote(ctx: Context<CastVote>) -> Result<()> {
    let poll = &ctx.accounts.poll;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    require!(
        current_time >= poll.start_time && current_time <= poll.end_time,
        VotingError::VotingPeriodInvalid
    );

    let candidate = &mut ctx.accounts.candidate;
    let vote_receipt = &mut ctx.accounts.vote_receipt;

    vote_receipt.voter = ctx.accounts.voter.key();
    vote_receipt.candidate_id = candidate.candidate_id;
    vote_receipt.poll_id = poll.poll_id;
    vote_receipt.timestamp = current_time;

    candidate.vote_count += 1;

    msg!("Vote cast for candidate: {}", candidate.name);
    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [
            CANDIDATE_SEED,
            poll.poll_id.to_le_bytes().as_ref(),
            candidate.candidate_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteReceipt::INIT_SPACE,
        seeds = [
            VOTE_SEED,
            poll.poll_id.to_le_bytes().as_ref(),
            voter.key().as_ref()
        ],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}
