use anchor_lang::prelude::*;

use crate::errors::VotingError;
use crate::states::*;

pub fn add_candidate(ctx: Context<AddCandidate>, name: String) -> Result<()> {
    require!(
        name.len() > 0 && name.len() <= 50,
        VotingError::InvalidCandidateName
    );

    let poll = &mut ctx.accounts.poll;
    let candidate = &mut ctx.accounts.candidate;

    candidate.candidate_id = poll.candidate_count;
    candidate.poll_id = poll.poll_id;
    candidate.name = name;
    candidate.vote_count = 0;

    poll.candidate_count += 1;

    msg!("Candidate added: {}", candidate.name);
    Ok(())
}

#[derive(Accounts)]
pub struct AddCandidate<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = payer,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [
            CANDIDATE_SEED,
            poll.poll_id.to_le_bytes().as_ref(),
            poll.candidate_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
