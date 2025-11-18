import { PublicKey, Connection } from '@solana/web3.js';
import BN from 'bn.js';
import idl from "./idl.json"

export const PROGRAM_ID = new PublicKey('Fsqy1AD1XjnsERPnFSWgdtS6Kk6LsJNuyESoRUEwT7Na');
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const DEVNET_RPC = 'https://api.devnet.solana.com';

export const POLL_SEED = Buffer.from('poll');
export const CANDIDATE_SEED = Buffer.from('candidate');
export const VOTE_SEED = Buffer.from('vote');

// Import IDL directly as an object instead of from JSON
export const IDL = idl;

export function getConnection() {
  return new Connection(DEVNET_RPC, { commitment: 'confirmed', confirmTransactionInitialTimeout: 60000 });
}

// Rest of your functions remain the same...
export function getPollPDA(pollId: BN, creator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('poll'),
      pollId.toArrayLike(Buffer, 'le', 8),
      creator.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export function getCandidatePDA(pollId: BN, candidateId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('candidate'),
      pollId.toArrayLike(Buffer, 'le', 8),
      candidateId.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
}

export function getVoteReceiptPDA(pollId: BN, voter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('vote'),
      pollId.toArrayLike(Buffer, 'le', 8),
      voter.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export interface Poll {
  pollId: bigint;
  description: string;
  startTime: bigint;
  endTime: bigint;
  candidateCount: bigint;
  creator: PublicKey;
}

export interface Candidate {
  candidateId: bigint;
  pollId: bigint;
  name: string;
  voteCount: bigint;
}

export async function getAllPolls(): Promise<Poll[]> {
  const connection = getConnection();
  try {
    const pollAccounts = await connection.getProgramAccounts(PROGRAM_ID);
    return pollAccounts
      .map((account) => {
        try {
          const data = account.account.data;
          let offset = 8;

          const pollId = BigInt(data.readBigInt64LE(offset));
          offset += 8;

          const descLen = data.readUInt32LE(offset);
          offset += 4;
          const description = data.toString('utf8', offset, offset + descLen);
          offset += descLen;

          const startTime = BigInt(data.readBigInt64LE(offset));
          offset += 8;
          const endTime = BigInt(data.readBigInt64LE(offset));
          offset += 8;
          const candidateCount = BigInt(data.readBigInt64LE(offset));
          offset += 8;
          const creator = new PublicKey(data.slice(offset, offset + 32));

          return { pollId, description, startTime, endTime, candidateCount, creator };
        } catch {
          return null;
        }
      })
      .filter((p) => p !== null) as Poll[];
  } catch {
    return [];
  }
}

export async function getCandidatesForPoll(pollId: bigint): Promise<Candidate[]> {
  const connection = getConnection();
  try {
    const candidateAccounts = await connection.getProgramAccounts(PROGRAM_ID);
    return candidateAccounts
      .map((account) => {
        try {
          const data = account.account.data;
          let offset = 8;

          const candidateId = BigInt(data.readBigInt64LE(offset));
          offset += 8;
          const accPollId = BigInt(data.readBigInt64LE(offset));
          offset += 8;

          if (accPollId !== pollId) return null;

          const nameLen = data.readUInt32LE(offset);
          offset += 4;
          const name = data.toString('utf8', offset, offset + nameLen);
          offset += nameLen;
          const voteCount = BigInt(data.readBigInt64LE(offset));

          return { candidateId, pollId: accPollId, name, voteCount };
        } catch {
          return null;
        }
      })
      .filter((c) => c !== null) as Candidate[];
  } catch {
    return [];
  }
}

export async function checkIfVoted(pollId: bigint, voter: PublicKey): Promise<boolean> {
  const connection = getConnection();
  try {
    const pollIdBN = new BN(pollId.toString());
    const [voteReceiptPDA] = getVoteReceiptPDA(pollIdBN, voter);
    const account = await connection.getAccountInfo(voteReceiptPDA);
    return account !== null;
  } catch {
    return false;
  }
}
