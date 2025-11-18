import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaVoting } from "../target/types/solana_voting";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

const POLL_SEED = "poll";
const CANDIDATE_SEED = "candidate";
const VOTE_SEED = "vote";

describe("solana_voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaVoting as Program<SolanaVoting>;

  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();
  const charlie = anchor.web3.Keypair.generate();

  const pollId1 = new anchor.BN(Date.now());
  const description1 = "Which programming language is better?";
  const pollId2 = new anchor.BN(Date.now() + 1000);
  const description2 = "Best blockchain platform?";

  const longDescription = "a".repeat(281);
  const maxDescription = "a".repeat(280);
  const emptyDescription = "";
  const unicodeDescription = "🚀 Which is better?";

  const candidateName1 = "Rust";
  const candidateName2 = "TypeScript";
  const candidateName3 = "Python";
  const emptyCandidateName = "";
  const longCandidateName = "a".repeat(51);
  const maxCandidateName = "a".repeat(50);
  const unicodeCandidateName = "Rust 🦀";

  let pollPda1: PublicKey;
  let pollPda2: PublicKey;
  let candidate1Pda: PublicKey;
  let candidate2Pda: PublicKey;
  let candidate3Pda: PublicKey;

  describe("Initialize Poll", async () => {
    it("Should successfully initialize a poll with valid topic and content", async () => {
      await airdrop(provider.connection, alice.publicKey);

      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      [pollPda1] = getPollAddress(pollId1, alice.publicKey, program.programId);

      await program.methods
        .initializePoll(pollId1, description1, startTime, endTime)
        .accounts({
          poll: pollPda1,
          creator: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkPoll(
        program,
        pollPda1,
        pollId1,
        description1,
        alice.publicKey,
        startTime,
        endTime,
        0
      );

      console.log("Poll initialized successfully");
    });

    it("Should successfully initialize poll with exactly 280-character description (boundary test)", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      const testPollId = new anchor.BN(Date.now() + 10);
      const [testPollPda] = getPollAddress(
        testPollId,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .initializePoll(testPollId, maxDescription, startTime, endTime)
        .accounts({
          poll: testPollPda,
          creator: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkPoll(
        program,
        testPollPda,
        testPollId,
        maxDescription,
        alice.publicKey,
        startTime,
        endTime,
        0
      );
    });

    it("Should successfully initialize poll with empty description", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      const testPollId = new anchor.BN(Date.now() + 11);
      const [testPollPda] = getPollAddress(
        testPollId,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .initializePoll(testPollId, emptyDescription, startTime, endTime)
        .accounts({
          poll: testPollPda,
          creator: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkPoll(
        program,
        testPollPda,
        testPollId,
        emptyDescription,
        alice.publicKey,
        startTime,
        endTime,
        0
      );
    });

    it("Should successfully initialize poll with unicode characters and emojis", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      const testPollId = new anchor.BN(Date.now() + 12);
      const [testPollPda] = getPollAddress(
        testPollId,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .initializePoll(testPollId, unicodeDescription, startTime, endTime)
        .accounts({
          poll: testPollPda,
          creator: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkPoll(
        program,
        testPollPda,
        testPollId,
        unicodeDescription,
        alice.publicKey,
        startTime,
        endTime,
        0
      );
    });

    it("Should fail to initialize poll when description exceeds 280 characters", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      const testPollId = new anchor.BN(Date.now() + 13);
      const [testPollPda] = getPollAddress(
        testPollId,
        alice.publicKey,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .initializePoll(testPollId, longDescription, startTime, endTime)
          .accounts({
            poll: testPollPda,
            creator: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "DescriptionTooLong",
          "Expected 'DescriptionTooLong' error for description longer than 280 bytes"
        );
        shouldFail = "Failed";
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Poll initialization should have failed with description longer than 280 bytes"
      );
    });

    it("Should fail to initialize poll when start time is after end time", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now + 86400);
      const endTime = new anchor.BN(now);

      const testPollId = new anchor.BN(Date.now() + 14);
      const [testPollPda] = getPollAddress(
        testPollId,
        alice.publicKey,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .initializePoll(testPollId, description1, startTime, endTime)
          .accounts({
            poll: testPollPda,
            creator: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidTimeRange",
          "Expected 'InvalidTimeRange' error for start time after end time"
        );
        shouldFail = "Failed";
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Poll initialization should have failed with invalid time range"
      );
    });

    it("Should fail to initialize duplicate poll with same poll ID from same creator", async () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .initializePoll(pollId1, "Different description", startTime, endTime)
          .accounts({
            poll: pollPda1,
            creator: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        shouldFail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error for duplicate poll with same ID from same creator"
        );
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Poll initialization should have failed when trying to create duplicate poll with same ID from same creator"
      );
    });

    it("Should allow different users to create polls with same poll ID", async () => {
      await airdrop(provider.connection, bob.publicKey);

      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + 86400);

      // Bob creates a poll with the same pollId1 - this should work because creator is different
      const [bobPollPda] = getPollAddress(
        pollId1,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .initializePoll(pollId1, description2, startTime, endTime)
        .accounts({
          poll: bobPollPda,
          creator: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPoll(
        program,
        bobPollPda,
        pollId1,
        description2,
        bob.publicKey,
        startTime,
        endTime,
        0
      );

      console.log("Different creator can create poll with same poll ID");
    });
  });

  describe("Add Candidate", async () => {
    it("Should successfully add first candidate to poll", async () => {
      [candidate1Pda] = getCandidateAddress(
        pollId1,
        new anchor.BN(0),
        program.programId
      );

      await program.methods
        .addCandidate(candidateName1)
        .accounts({
          poll: pollPda1,
          candidate: candidate1Pda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate1Pda,
        new anchor.BN(0),
        pollId1,
        candidateName1,
        0
      );

      const poll = await program.account.poll.fetch(pollPda1);
      assert.strictEqual(
        poll.candidateCount.toNumber(),
        1,
        "Poll candidate count should be 1"
      );

      console.log("First candidate added successfully");
    });

    it("Should successfully add second candidate to poll", async () => {
      [candidate2Pda] = getCandidateAddress(
        pollId1,
        new anchor.BN(1),
        program.programId
      );

      await program.methods
        .addCandidate(candidateName2)
        .accounts({
          poll: pollPda1,
          candidate: candidate2Pda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate2Pda,
        new anchor.BN(1),
        pollId1,
        candidateName2,
        0
      );

      const poll = await program.account.poll.fetch(pollPda1);
      assert.strictEqual(
        poll.candidateCount.toNumber(),
        2,
        "Poll candidate count should be 2"
      );
    });

    it("Should successfully add third candidate to poll", async () => {
      [candidate3Pda] = getCandidateAddress(
        pollId1,
        new anchor.BN(2),
        program.programId
      );

      await program.methods
        .addCandidate(candidateName3)
        .accounts({
          poll: pollPda1,
          candidate: candidate3Pda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate3Pda,
        new anchor.BN(2),
        pollId1,
        candidateName3,
        0
      );

      const poll = await program.account.poll.fetch(pollPda1);
      assert.strictEqual(
        poll.candidateCount.toNumber(),
        3,
        "Poll candidate count should be 3"
      );
    });

    it("Should successfully add candidate with exactly 50 characters (boundary test)", async () => {
      const poll = await program.account.poll.fetch(pollPda1);
      const nextCandidateId = poll.candidateCount;

      const [candidatePda] = getCandidateAddress(
        pollId1,
        nextCandidateId,
        program.programId
      );

      await program.methods
        .addCandidate(maxCandidateName)
        .accounts({
          poll: pollPda1,
          candidate: candidatePda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidatePda,
        nextCandidateId,
        pollId1,
        maxCandidateName,
        0
      );
    });

    it("Should successfully add candidate with unicode characters and emojis", async () => {
      const poll = await program.account.poll.fetch(pollPda1);
      const nextCandidateId = poll.candidateCount;

      const [candidatePda] = getCandidateAddress(
        pollId1,
        nextCandidateId,
        program.programId
      );

      await program.methods
        .addCandidate(unicodeCandidateName)
        .accounts({
          poll: pollPda1,
          candidate: candidatePda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidatePda,
        nextCandidateId,
        pollId1,
        unicodeCandidateName,
        0
      );
    });

    it("Should fail to add candidate with empty name", async () => {
      const poll = await program.account.poll.fetch(pollPda1);
      const nextCandidateId = poll.candidateCount;

      const [candidatePda] = getCandidateAddress(
        pollId1,
        nextCandidateId,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .addCandidate(emptyCandidateName)
          .accounts({
            poll: pollPda1,
            candidate: candidatePda,
            payer: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidCandidateName",
          "Expected 'InvalidCandidateName' error for empty candidate name"
        );
        shouldFail = "Failed";
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Candidate addition should have failed with empty name"
      );
    });

    it("Should fail to add candidate with name exceeding 50 characters", async () => {
      const poll = await program.account.poll.fetch(pollPda1);
      const nextCandidateId = poll.candidateCount;

      const [candidatePda] = getCandidateAddress(
        pollId1,
        nextCandidateId,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .addCandidate(longCandidateName)
          .accounts({
            poll: pollPda1,
            candidate: candidatePda,
            payer: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidCandidateName",
          "Expected 'InvalidCandidateName' error for name longer than 50 characters"
        );
        shouldFail = "Failed";
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Candidate addition should have failed with name longer than 50 characters"
      );
    });

    it("Should fail to add candidate to non-existent poll", async () => {
      const fakePollId = new anchor.BN(999999);
      const [fakePollPda] = getPollAddress(
        fakePollId,
        alice.publicKey,
        program.programId
      );
      const [candidatePda] = getCandidateAddress(
        fakePollId,
        new anchor.BN(0),
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .addCandidate(candidateName1)
          .accounts({
            poll: fakePollPda,
            candidate: candidatePda,
            payer: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        shouldFail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to add candidate to non-existent poll"
        );
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Should not be able to add candidate to non-existent poll"
      );
    });
  });

  describe("Cast Vote", async () => {
    it("Should successfully cast vote for first candidate", async () => {
      await airdrop(provider.connection, charlie.publicKey);

      const [voteReceiptPda] = getVoteReceiptAddress(
        pollId1,
        charlie.publicKey,
        program.programId
      );

      const candidateBefore = await program.account.candidate.fetch(
        candidate1Pda
      );
      const voteCountBefore = candidateBefore.voteCount.toNumber();

      await program.methods
        .castVote()
        .accounts({
          poll: pollPda1,
          candidate: candidate1Pda,
          voteReceipt: voteReceiptPda,
          voter: charlie.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate1Pda,
        new anchor.BN(0),
        pollId1,
        candidateName1,
        voteCountBefore + 1
      );

      await checkVoteReceipt(
        program,
        voteReceiptPda,
        charlie.publicKey,
        new anchor.BN(0),
        pollId1
      );

      console.log("Vote cast successfully");
    });

    it("Should successfully cast vote from different user", async () => {
      const [voteReceiptPda] = getVoteReceiptAddress(
        pollId1,
        alice.publicKey,
        program.programId
      );

      const candidateBefore = await program.account.candidate.fetch(
        candidate2Pda
      );
      const voteCountBefore = candidateBefore.voteCount.toNumber();

      await program.methods
        .castVote()
        .accounts({
          poll: pollPda1,
          candidate: candidate2Pda,
          voteReceipt: voteReceiptPda,
          voter: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate2Pda,
        new anchor.BN(1),
        pollId1,
        candidateName2,
        voteCountBefore + 1
      );

      await checkVoteReceipt(
        program,
        voteReceiptPda,
        alice.publicKey,
        new anchor.BN(1),
        pollId1
      );
    });

    it("Should fail when attempting to vote twice", async () => {
      const [voteReceiptPda] = getVoteReceiptAddress(
        pollId1,
        charlie.publicKey,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .castVote()
          .accounts({
            poll: pollPda1,
            candidate: candidate1Pda,
            voteReceipt: voteReceiptPda,
            voter: charlie.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([charlie])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        shouldFail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to vote twice"
        );
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Should not be able to vote twice"
      );
    });

    it("Should fail when voting period has not started", async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 100000;
      const startTime = new anchor.BN(futureTime);
      const endTime = new anchor.BN(futureTime + 86400);

      const futurePollId = new anchor.BN(Date.now() + 100);
      const [futurePollPda] = getPollAddress(
        futurePollId,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .initializePoll(futurePollId, "Future poll", startTime, endTime)
        .accounts({
          poll: futurePollPda,
          creator: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const [futureCandidatePda] = getCandidateAddress(
        futurePollId,
        new anchor.BN(0),
        program.programId
      );

      await program.methods
        .addCandidate("Option A")
        .accounts({
          poll: futurePollPda,
          candidate: futureCandidatePda,
          payer: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const [voteReceiptPda] = getVoteReceiptAddress(
        futurePollId,
        bob.publicKey,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .castVote()
          .accounts({
            poll: futurePollPda,
            candidate: futureCandidatePda,
            voteReceipt: voteReceiptPda,
            voter: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "VotingPeriodInvalid",
          "Expected 'VotingPeriodInvalid' error when voting before poll starts"
        );
        shouldFail = "Failed";
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Should not be able to vote before poll starts"
      );
    });

    it("Should fail when voting on non-existent candidate", async () => {
      const [fakeCandidatePda] = getCandidateAddress(
        pollId1,
        new anchor.BN(999),
        program.programId
      );

      const [voteReceiptPda] = getVoteReceiptAddress(
        pollId1,
        bob.publicKey,
        program.programId
      );

      let shouldFail = "This Should Fail";
      try {
        await program.methods
          .castVote()
          .accounts({
            poll: pollPda1,
            candidate: fakeCandidatePda,
            voteReceipt: voteReceiptPda,
            voter: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        shouldFail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when voting for non-existent candidate"
        );
      }
      assert.strictEqual(
        shouldFail,
        "Failed",
        "Should not be able to vote for non-existent candidate"
      );
    });
  });

  describe("Edge Cases and Final State", async () => {
    it("Should allow poll creator to vote on their own poll", async () => {
      const [voteReceiptPda] = getVoteReceiptAddress(
        pollId1,
        bob.publicKey,
        program.programId
      );

      const candidateBefore = await program.account.candidate.fetch(
        candidate3Pda
      );
      const voteCountBefore = candidateBefore.voteCount.toNumber();

      await program.methods
        .castVote()
        .accounts({
          poll: pollPda1,
          candidate: candidate3Pda,
          voteReceipt: voteReceiptPda,
          voter: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkCandidate(
        program,
        candidate3Pda,
        new anchor.BN(2),
        pollId1,
        candidateName3,
        voteCountBefore + 1
      );
    });

    it("Should maintain correct final vote counts across all candidates", async () => {
      await checkCandidate(
        program,
        candidate1Pda,
        new anchor.BN(0),
        pollId1,
        candidateName1,
        1
      );

      await checkCandidate(
        program,
        candidate2Pda,
        new anchor.BN(1),
        pollId1,
        candidateName2,
        1
      );

      await checkCandidate(
        program,
        candidate3Pda,
        new anchor.BN(2),
        pollId1,
        candidateName3,
        1
      );
    });

    it("Should verify final poll state is correct", async () => {
      const poll = await program.account.poll.fetch(pollPda1);

      assert.strictEqual(
        poll.candidateCount.toNumber(),
        5,
        "Poll should have 5 candidates total"
      );
      assert.strictEqual(
        poll.pollId.toString(),
        pollId1.toString(),
        "Poll ID should match"
      );
      assert.strictEqual(
        poll.description,
        description1,
        "Poll description should match"
      );
    });
  });
});

// Helper functions
async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

function getPollAddress(
  pollId: anchor.BN,
  creator: PublicKey,
  programId: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(POLL_SEED),
      pollId.toArrayLike(Buffer, "le", 8),
      creator.toBuffer(),
    ],
    programId
  );
}

function getCandidateAddress(
  pollId: anchor.BN,
  candidateId: anchor.BN,
  programId: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(CANDIDATE_SEED),
      pollId.toArrayLike(Buffer, "le", 8),
      candidateId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

function getVoteReceiptAddress(
  pollId: anchor.BN,
  voter: PublicKey,
  programId: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(VOTE_SEED),
      pollId.toArrayLike(Buffer, "le", 8),
      voter.toBuffer(),
    ],
    programId
  );
}

class SolanaError {
  static contains(logs, error): boolean {
    const match = logs?.filter((s) => s.includes(error));
    return Boolean(match?.length);
  }
}

async function checkPoll(
  program: anchor.Program<SolanaVoting>,
  pollPda: PublicKey,
  pollId?: anchor.BN,
  description?: string,
  creator?: PublicKey,
  startTime?: anchor.BN,
  endTime?: anchor.BN,
  candidateCount?: number
) {
  let pollData = await program.account.poll.fetch(pollPda);

  if (pollId) {
    assert.strictEqual(
      pollData.pollId.toString(),
      pollId.toString(),
      `Poll ID should be ${pollId.toString()} but was ${pollData.pollId.toString()}`
    );
  }
  if (description !== undefined) {
    assert.strictEqual(
      pollData.description,
      description,
      `Poll description should be "${description}" but was "${pollData.description}"`
    );
  }
  if (creator) {
    assert.strictEqual(
      pollData.creator.toString(),
      creator.toString(),
      `Poll creator should be ${creator.toString()} but was ${pollData.creator.toString()}`
    );
  }
  if (startTime) {
    assert.strictEqual(
      pollData.startTime.toString(),
      startTime.toString(),
      `Poll start time should be ${startTime.toString()} but was ${pollData.startTime.toString()}`
    );
  }
  if (endTime) {
    assert.strictEqual(
      pollData.endTime.toString(),
      endTime.toString(),
      `Poll end time should be ${endTime.toString()} but was ${pollData.endTime.toString()}`
    );
  }
  if (candidateCount !== undefined) {
    assert.strictEqual(
      pollData.candidateCount.toNumber(),
      candidateCount,
      `Poll candidate count should be ${candidateCount} but was ${pollData.candidateCount.toNumber()}`
    );
  }
}

async function checkCandidate(
  program: anchor.Program<SolanaVoting>,
  candidatePda: PublicKey,
  candidateId?: anchor.BN,
  pollId?: anchor.BN,
  name?: string,
  voteCount?: number
) {
  let candidateData = await program.account.candidate.fetch(candidatePda);

  if (candidateId) {
    assert.strictEqual(
      candidateData.candidateId.toString(),
      candidateId.toString(),
      `Candidate ID should be ${candidateId.toString()} but was ${candidateData.candidateId.toString()}`
    );
  }
  if (pollId) {
    assert.strictEqual(
      candidateData.pollId.toString(),
      pollId.toString(),
      `Candidate poll ID should be ${pollId.toString()} but was ${candidateData.pollId.toString()}`
    );
  }
  if (name !== undefined) {
    assert.strictEqual(
      candidateData.name,
      name,
      `Candidate name should be "${name}" but was "${candidateData.name}"`
    );
  }
  if (voteCount !== undefined) {
    assert.strictEqual(
      candidateData.voteCount.toNumber(),
      voteCount,
      `Candidate vote count should be ${voteCount} but was ${candidateData.voteCount.toNumber()}`
    );
  }
}

async function checkVoteReceipt(
  program: anchor.Program<SolanaVoting>,
  voteReceiptPda: PublicKey,
  voter?: PublicKey,
  candidateId?: anchor.BN,
  pollId?: anchor.BN
) {
  let voteReceiptData = await program.account.voteReceipt.fetch(voteReceiptPda);

  if (voter) {
    assert.strictEqual(
      voteReceiptData.voter.toString(),
      voter.toString(),
      `Vote receipt voter should be ${voter.toString()} but was ${voteReceiptData.voter.toString()}`
    );
  }
  if (candidateId) {
    assert.strictEqual(
      voteReceiptData.candidateId.toString(),
      candidateId.toString(),
      `Vote receipt candidate ID should be ${candidateId.toString()} but was ${voteReceiptData.candidateId.toString()}`
    );
  }
  if (pollId) {
    assert.strictEqual(
      voteReceiptData.pollId.toString(),
      pollId.toString(),
      `Vote receipt poll ID should be ${pollId.toString()} but was ${voteReceiptData.pollId.toString()}`
    );
  }
}
