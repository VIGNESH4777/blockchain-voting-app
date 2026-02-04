const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
    let Voting;
    let voting;
    let owner;
    let voter1;
    let voter2;
    let electionId;

    beforeEach(async function () {
        Voting = await ethers.getContractFactory("Voting");
        [owner, voter1, voter2] = await ethers.getSigners();
        voting = await Voting.deploy();
        await voting.deployed();

        // Create an election for testing
        const tx = await voting.createElection("Class President", ["Alice", "Bob"]);
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === 'ElectionCreated');
        electionId = event.args.electionId;
    });

    it("Should create an election", async function () {
        expect(await voting.getElectionCount()).to.equal(1);
        expect(await voting.getElectionName(electionId)).to.equal("Class President");
        const candidates = await voting.getCandidates(electionId);
        expect(candidates.length).to.equal(2);
        expect(candidates[0]).to.equal("Alice");
    });

    it("Should register a voter", async function () {
        await voting.registerVoterForElection(electionId, voter1.address);
        // Note: There isn't a direct isRegistered public getter for a single address readily exposed for simple boolean check 
        // without accessing the struct mapping (which is internal to the struct mapping access patterns in solidity unless a getter is made).
        // BUT, getVoters exists and is owner only.
        const voters = await voting.getVoters(electionId);
        expect(voters).to.include(voter1.address);
    });

    it("Should not allow double registration", async function () {
        await voting.registerVoterForElection(electionId, voter1.address);
        await expect(voting.registerVoterForElection(electionId, voter1.address))
            .to.be.revertedWith("Voter is already registered.");
    });

    it("Should allow a registered voter to vote", async function () {
        await voting.registerVoterForElection(electionId, voter1.address);
        // Vote for Alice (index 0)
        await voting.connect(voter1).vote(electionId, 0);

        const votesAlice = await voting.getVotes(electionId, 0);
        expect(votesAlice).to.equal(1);
    });

    it("Should not allow a voter to vote twice", async function () {
        await voting.registerVoterForElection(electionId, voter1.address);
        await voting.connect(voter1).vote(electionId, 0);
        await expect(voting.connect(voter1).vote(electionId, 0))
            .to.be.revertedWith("You have already voted in this election.");
    });

    it("Should tally votes correctly", async function () {
        await voting.registerVoterForElection(electionId, voter1.address);
        await voting.registerVoterForElection(electionId, voter2.address);

        await voting.connect(voter1).vote(electionId, 0); // Alice
        await voting.connect(voter2).vote(electionId, 1); // Bob

        const votesAlice = await voting.getVotes(electionId, 0);
        const votesBob = await voting.getVotes(electionId, 1);

        expect(votesAlice).to.equal(1);
        expect(votesBob).to.equal(1);
    });
});