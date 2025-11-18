use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("Start time must be before end time")]
    InvalidTimeRange,
    #[msg("Description must be 280 characters or less")]
    DescriptionTooLong,
    #[msg("Candidate name must be between 1 and 50 characters")]
    InvalidCandidateName,
    #[msg("Voting is not active for this poll")]
    VotingPeriodInvalid,
}
