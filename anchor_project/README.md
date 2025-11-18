# Solana Voting Program

A decentralized voting system built on the Solana blockchain using the Anchor framework. This program enables users to create polls, add candidates, and cast votes in a transparent and tamper-proof manner.

## Overview

The Solana Voting Program provides a complete voting infrastructure on the blockchain, ensuring transparency, immutability, and verifiability of all voting activities. Each poll is independent, secure, and time-bound, making it suitable for various voting scenarios from governance decisions to community polls.

## Program ID (Devnet)

```
Fsqy1AD1XjnsERPnFSWgdtS6Kk6LsJNuyESoRUEwT7Na
```

## Instructions

### 1. Initialize Poll
Creates a new poll with a unique ID, description, and voting time window.

**Parameters:**
- `poll_id`: Unique identifier for the poll
- `description`: Poll description (max 280 characters)
- `start_time`: Unix timestamp when voting begins
- `end_time`: Unix timestamp when voting ends

**Validation:**
- Start time must be before end time
- Description must be 280 characters or less

### 2. Add Candidate
Adds a candidate to an existing poll. Only available before the voting period starts.

**Parameters:**
- `name`: Candidate name (1-50 characters)

**Validation:**
- Candidate name must be between 1 and 50 characters

### 3. Cast Vote
Allows users to vote for a candidate in an active poll. Each user can only vote once per poll.

**Validation:**
- Voting must be within the poll's active time window
- One vote per user per poll (enforced by PDA derivation)

## Account Structures

### Poll Account
Stores poll metadata and configuration.

```rust
pub struct Poll {
    pub poll_id: u64,           // Unique poll identifier
    pub description: String,     // Poll description (max 280 chars)
    pub start_time: i64,        // Voting start timestamp
    pub end_time: i64,          // Voting end timestamp
    pub candidate_count: u64,   // Number of candidates
    pub creator: Pubkey,        // Poll creator's public key
}
```

### Candidate Account
Represents a candidate in a specific poll.

```rust
pub struct Candidate {
    pub candidate_id: u64,      // Unique candidate ID within poll
    pub poll_id: u64,          // Associated poll ID
    pub name: String,          // Candidate name (max 50 chars)
    pub vote_count: u64,       // Total votes received
}
```

### Vote Receipt Account
Records individual vote transactions for audit and verification.

```rust
pub struct VoteReceipt {
    pub voter: Pubkey,         // Voter's public key
    pub candidate_id: u64,     // Voted candidate ID
    pub poll_id: u64,         // Associated poll ID
    pub timestamp: i64,       // Vote timestamp
}
```

## PDA (Program Derived Address) Seeds

### Poll PDA
**Seeds:** `["poll", poll_id, creator_pubkey]`

- Ensures each creator can have multiple polls with unique IDs
- Prevents poll ID conflicts between different creators

### Candidate PDA
**Seeds:** `["candidate", poll_id, candidate_id]`

- Creates unique addresses for each candidate within a poll
- Candidate ID is auto-incremented based on poll's candidate_count

### Vote Receipt PDA
**Seeds:** `["vote", poll_id, voter_pubkey]`

- Ensures one vote per user per poll
- Creates a permanent record of the voting transaction
- Enables vote verification and audit trails

## Error Handling

The program includes comprehensive error handling:

- `InvalidTimeRange`: Start time must be before end time
- `DescriptionTooLong`: Poll description exceeds 280 characters
- `InvalidCandidateName`: Candidate name is empty or exceeds 50 characters
- `VotingPeriodInvalid`: Attempt to vote outside the active voting window

## Use Cases

### 1. Governance Voting
- DAO proposal voting
- Protocol upgrades and parameter changes
- Community governance decisions

### 2. Elections
- Student council elections
- Board member selections
- Leadership positions

### 3. Community Polls
- Feature request prioritization
- Event planning decisions
- General community sentiment

### 4. Organizational Decision Making
- Budget allocation voting
- Project prioritization
- Policy decisions

## Key Features

### Transparency
- All votes are recorded on-chain and publicly verifiable
- Vote counts are automatically tallied and cannot be manipulated

### Security
- One vote per user per poll enforced by blockchain
- Time-bound voting windows prevent manipulation
- Immutable vote records

### Decentralization
- No central authority controls the voting process
- Censorship-resistant voting system
- Trustless vote verification

### Efficiency
- Low transaction costs on Solana
- Fast transaction confirmation
- Scalable to handle multiple concurrent polls

## Getting Started

1. **Deploy the Program**: Deploy to Solana devnet/mainnet
2. **Initialize a Poll**: Create a new poll with your desired parameters
3. **Add Candidates**: Add all candidates before voting begins
4. **Cast Votes**: Users can vote during the active voting period
5. **View Results**: Check vote counts on any candidate account

## Dependencies

- Anchor Framework v0.31.1
- Solana Program Library

This voting system provides a solid foundation for any democratic decision-making process that requires transparency, security, and verifiability.
