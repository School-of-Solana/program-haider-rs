# Solana Polls Frontend

A React-based frontend application for creating and participating in decentralized polls on the Solana blockchain.

🌐 **Live Demo**: [https://sparkly-frangipane-779222.netlify.app/](https://sparkly-frangipane-779222.netlify.app/)

## Features

- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Poll Management**: Create, view, and participate in time-bound polls
- **Real-time Updates**: Automatic polling updates every 10 seconds
- **Candidate Management**: Add candidates to active polls
- **Vote Tracking**: Prevent double voting and track vote counts
- **Time Management**: Visual indicators for poll status (not started, active, ended)

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Solana Integration**: 
  - `@solana/wallet-adapter-react` for wallet connections
  - `@coral-xyz/anchor` for program interactions
  - `@solana/web3.js` for blockchain operations
- **Styling**: Custom CSS with responsive design
- **Deployment**: Netlify

## Project Structure

```
src/
├── App.tsx              # Main application component
├── main.tsx            # Application entry point with wallet providers
├── solana.ts           # Solana blockchain interactions and data fetching
├── instructions.ts     # Program instruction handlers
├── idl.json           # Anchor program IDL
└── index.css          # Application styles
```

## Core Components

### App.tsx
Main application component containing:
- **CreatePollModal**: Modal for creating new polls with date/time validation
- **AddCandidateModal**: Modal for adding candidates to existing polls
- **Poll Grid**: Displays all polls with status indicators
- **Poll Detail View**: Shows candidates, vote counts, and voting interface

## User Flow

### 1. Connect Wallet
- Users must connect a Solana wallet (Phantom, Solflare, etc.) to interact with polls
- Wallet connection enables all poll creation, candidate addition, and voting functions

### 2. View Polls
- Home page displays all polls in a grid layout

### 3. Create Poll
- Click "Create Poll" button (requires connected wallet)
- Fill in poll description
- Set start and end date/time
- System validates that end time is after start time
- Generates unique poll ID based on current timestamp

### 4. View Poll Details
- Click on any poll card to view details
- See full poll information and all candidates
- View vote counts for each candidate
- Check poll timeline and remaining time

### 5. Add Candidates
- Only possible during active poll period
- Enter candidate name in modal
- System automatically increments candidate count

### 6. Vote
- Only possible during active poll period
- One vote per wallet per poll
- Vote button becomes disabled after voting
- Real-time vote count updates

## Poll Status System

Polls have three distinct states:

- **NOT STARTED**: Current time is before start time
- **ACTIVE**: Current time is between start and end time
  - Candidates can be added
  - Votes can be cast
- **ENDED**: Current time is after end time
  - No new candidates or votes allowed
  - Results are final

## Development Setup

1. Install dependencies:
```bash
yarn install
```

2. Start development server:
```bash
yarn dev
```

## Program Integration

This frontend interfaces with a Solana program deployed on devnet. The program handles:
- Poll creation and management
- Candidate registration
- Vote recording and validation
- Account state management

All blockchain interactions use the Anchor framework for type-safe program calls.

