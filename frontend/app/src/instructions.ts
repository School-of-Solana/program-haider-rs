import { PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { BN } from 'bn.js';
import { getConnection, PROGRAM_ID, getPollPDA, getCandidatePDA, getVoteReceiptPDA, IDL } from './solana';

function getProvider(wallet: WalletContextState) {
  const connection = getConnection();

  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet not properly connected');
  }

  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    } as any,
    {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    }
  );
}

export async function initializePoll(
  wallet: WalletContextState,
  pollId: bigint,
  description: string,
  startTime: number,
  endTime: number
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const provider = getProvider(wallet);
  const program = new Program(IDL as Idl, provider);
  const connection = getConnection();

  // Convert all values to BN
  const pollIdBN = new BN(pollId.toString());
  const startTimeBN = new BN(startTime);
  const endTimeBN = new BN(endTime);

  const [pollPDA] = getPollPDA(pollIdBN, wallet.publicKey);

  try {
    const tx = await program.methods
      .initializePoll(pollIdBN, description, startTimeBN, endTimeBN)
      .accounts({
        poll: pollPDA,
        creator: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(tx, 'confirmed');
    return tx;
  } catch (err) {
    console.error('Initialize poll error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to initialize poll');
  }
}

export async function addCandidate(
  wallet: WalletContextState,
  pollId: bigint,
  candidateCount: bigint,
  name: string
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const provider = getProvider(wallet);
  const program = new Program(IDL as Idl, provider);
  const connection = getConnection();

  // Convert all values to BN
  const pollIdBN = new BN(pollId.toString());
  const candidateCountBN = new BN(candidateCount.toString());

  const [pollPDA] = getPollPDA(pollIdBN, wallet.publicKey);
  const [candidatePDA] = getCandidatePDA(pollIdBN, candidateCountBN);

  try {
    const tx = await program.methods
      .addCandidate(name)
      .accounts({
        poll: pollPDA,
        candidate: candidatePDA,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(tx, 'confirmed');
    return tx;
  } catch (err) {
    console.error('Add candidate error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to add candidate');
  }
}

export async function castVote(
  wallet: WalletContextState,
  pollId: bigint,
  candidateId: bigint
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const provider = getProvider(wallet);
  const program = new Program(IDL as Idl, provider);
  const connection = getConnection();

  // Convert all values to BN
  const pollIdBN = new BN(pollId.toString());
  const candidateIdBN = new BN(candidateId.toString());

  const [pollPDA] = getPollPDA(pollIdBN, wallet.publicKey);
  const [candidatePDA] = getCandidatePDA(pollIdBN, candidateIdBN);
  const [voteReceiptPDA] = getVoteReceiptPDA(pollIdBN, wallet.publicKey);

  try {
    const tx = await program.methods
      .castVote()
      .accounts({
        poll: pollPDA,
        candidate: candidatePDA,
        voteReceipt: voteReceiptPDA,
        voter: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await connection.confirmTransaction(tx, 'confirmed');
    return tx;
  } catch (err) {
    console.error('Cast vote error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to cast vote');
  }
}
