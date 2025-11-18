# Project Description

**Deployed Frontend URL:** https://sparkly-frangipane-779222.netlify.app/

**Solana Program ID:** Fsqy1AD1XjnsERPnFSWgdtS6Kk6LsJNuyESoRUEwT7Na

## Project Overview

### Description
A decentralized polling application built on Solana blockchain. Users can create time-bound polls, add candidates, and cast votes in a transparent and tamper-proof manner. Each poll is uniquely identified and managed through Program Derived Addresses (PDAs), ensuring data integrity and preventing double voting. This dApp demonstrates advanced Solana concepts including complex account relationships, time-based validation, and multi-user interactions.

### Key Features
- **Create Polls**: Initialize time-bound polls with custom descriptions and voting periods
- **Add Candidates**: Register multiple candidates for any active poll
- **Cast Votes**: Secure voting mechanism with double-vote prevention
- **Real-time Updates**: Live poll status updates and vote counting
- **Time Management**: Automatic poll status transitions (not started, active, ended)
- **Vote Tracking**: Transparent vote receipts and candidate vote counts

### How to Use the dApp
1. **Connect Wallet** - Connect your Solana wallet (Phantom, Solflare supported)
2. **Create Poll** - Click "Create Poll" and set description, start time, and end time
3. **Add Candidates** - Navigate to any poll and add candidates during active period
4. **Cast Vote** - Vote for your preferred candidate (one vote per poll per wallet)
5. **View Results** - Monitor real-time vote counts and poll statistics
6. **Browse Polls** - Explore all polls with status indicators and time remaining

## Program Architecture
The Solana Polls dApp uses a sophisticated three-account architecture with temporal validation and relationship management. The program leverages multiple PDAs to create isolated data structures for polls, candidates, and vote receipts, ensuring scalability and data integrity across concurrent polls.

### PDA Usage
The program uses Program Derived Addresses to create deterministic and unique accounts for all entities.

**PDAs Used:**
- **Poll PDA**: Derived from seeds ["poll", poll_id_bytes, creator_pubkey] - ensures unique poll identification per creator
- **Candidate PDA**: Derived from seeds ["candidate", poll_id_bytes, candidate_id_bytes] - links candidates to specific polls
- **Vote Receipt PDA**: Derived from seeds ["vote", poll_id_bytes, voter_pubkey] - prevents double voting per poll

### Program Instructions
**Instructions Implemented:**
- **Initialize Poll**: Creates a new poll with description, start/end times, and initializes candidate counter
- **Add Candidate**: Registers a new candidate for an existing poll and increments candidate count
- **Cast Vote**: Records a vote for a specific candidate and creates a vote receipt to prevent double voting

### Account Structure
```rust
#[account]
pub struct Poll {
    pub poll_id: u64,           // Unique identifier for the poll
    pub description: String,     // Poll description (max 280 characters)
    pub start_time: i64,        // Unix timestamp when voting starts
    pub end_time: i64,          // Unix timestamp when voting ends
    pub candidate_count: u64,    // Number of candidates registered
    pub creator: Pubkey,        // Wallet that created the poll
}

#[account]
pub struct Candidate {
    pub candidate_id: u64,      // Sequential ID within the poll
    pub poll_id: u64,           // Reference to parent poll
    pub name: String,           // Candidate name (max 50 characters)
    pub vote_count: u64,        // Total votes received
}

#[account]
pub struct VoteReceipt {
    pub voter: Pubkey,          // Wallet that cast the vote
    pub candidate_id: u64,      // Candidate that received the vote
    pub poll_id: u64,           // Poll where vote was cast
    pub timestamp: i64,         // When the vote was cast
}

## Testing

### Test Coverage
Comprehensive test suite covering all instructions with extensive edge cases, boundary conditions, and error scenarios to ensure program security, data integrity, and temporal validation.

**Initialize Poll Tests (9 test cases):**
- **Valid Poll Creation**: Successfully creates polls with valid descriptions and time ranges
- **Boundary Testing**: Tests exactly 280-character descriptions and empty descriptions
- **Unicode Support**: Handles emojis and special characters in poll descriptions
- **Invalid Time Range**: Fails when start time is after end time
- **Description Too Long**: Fails when description exceeds 280 characters
- **Duplicate Prevention**: Prevents creating duplicate polls with same ID from same creator
- **Multi-User Support**: Allows different users to create polls with same poll IDs

**Add Candidate Tests (9 test cases):**
- **Sequential Addition**: Successfully adds multiple candidates to polls with proper ID assignment
- **Candidate Count Tracking**: Verifies poll candidate count increments correctly
- **Boundary Testing**: Tests exactly 50-character candidate names
- **Unicode Support**: Handles emojis and special characters in candidate names
- **Invalid Names**: Fails with empty names or names exceeding 50 characters
- **Non-existent Poll**: Fails gracefully when adding candidates to non-existent polls

**Cast Vote Tests (6 test cases):**
- **Successful Voting**: Records votes correctly and updates candidate vote counts
- **Multi-User Voting**: Different users can vote on same poll for different candidates
- **Double Vote Prevention**: Prevents same user from voting twice in same poll
- **Time Validation**: Prevents voting before poll start time
- **Non-existent Candidate**: Fails when voting for non-existent candidates
- **Vote Receipt Creation**: Creates proper vote receipts with correct timestamps

**Edge Cases and Final State (3 test cases):**
- **Creator Voting**: Allows poll creators to vote on their own polls
- **Vote Count Verification**: Maintains correct final vote counts across all candidates
- **Poll State Integrity**: Verifies final poll state matches expected values

### Test Implementation Details

**Helper Functions:**
- **PDA Generation**: `getPollAddress()`, `getCandidateAddress()`, `getVoteReceiptAddress()`
- **Account Validation**: `checkPoll()`, `checkCandidate()`, `checkVoteReceipt()`
- **Network Setup**: `airdrop()` for test wallet funding
- **Error Handling**: Custom `SolanaError` class for log analysis

**Test Data:**
- **Multiple Users**: Alice (poll creator), Bob (second creator), Charlie (voter)
- **Boundary Values**: 280-char descriptions, 50-char candidate names, unicode strings
- **Time Management**: Current timestamps, future times for validation testing

### Running Tests
```bash
yarn install    # install dependencies
anchor test     # run tests
```

### Additional Notes for Evaluators
This was my first Solana dApp. I was comfortable working with Rust and Solana, these were self explanatory to me. I did not find much problem in learning solana concepts and how things are architectured this way. Becuase i understand solana storage model is not like other chains and things are stored in accounts to have to architect things that way. The most challenging part was to work with typescript since i dont have much experience with it. I had to spend alot of time on frontend integration and testing. Overall it was a great learning experience and I am proud of the final product!

