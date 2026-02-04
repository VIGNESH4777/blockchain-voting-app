// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Voting {
    address public owner;
    uint public electionCount;

    struct Election {
        string name;
        string[] candidates;
        address[] voters;
        mapping(uint => uint256) votesPerCandidate; // candidate index -> votes
        mapping(address => bool) registeredVoters;
        mapping(address => bool) hasVoted;
        bool exists;
        uint256 startTime;
        uint256 endTime;
    }

    // mapping of electionId => Election (contains mappings, so stored)
    mapping(uint => Election) private elections;

    event ElectionCreated(uint indexed electionId, string name, uint256 startTime, uint256 endTime);
    event VoterRegistered(uint indexed electionId, address indexed voter);
    event Voted(uint indexed electionId, address indexed voter, uint candidateIndex);

    constructor() {
        owner = msg.sender;
        electionCount = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    // create a new election with a name and candidate list
    function createElection(string memory _name, string[] memory _candidateNames, uint256 _startTime, uint256 _endTime) public onlyOwner returns (uint) {
        require(_candidateNames.length > 0, "Provide at least one candidate.");
        require(_endTime > _startTime, "End time must be after start time.");
        
        electionCount += 1;
        uint id = electionCount;
        Election storage e = elections[id];
        e.name = _name;
        for (uint i = 0; i < _candidateNames.length; i++) {
            e.candidates.push(_candidateNames[i]);
            e.votesPerCandidate[i] = 0;
        }
        e.exists = true;
        e.startTime = _startTime;
        e.endTime = _endTime;
        
        emit ElectionCreated(id, _name, _startTime, _endTime);
        return id;
    }

    // register a single voter for a specific election
    function registerVoterForElection(uint _electionId, address _voterAddress) public onlyOwner {
        require(elections[_votingIdOrCheck(_electionId)].exists, "Election does not exist.");
        Election storage e = elections[_electionId];
        require(!e.registeredVoters[_voterAddress], "Voter is already registered.");
        e.registeredVoters[_voterAddress] = true;
        e.voters.push(_voterAddress);
        emit VoterRegistered(_electionId, _voterAddress);
    }

    // register multiple voters at once
    function registerVotersForElection(uint _electionId, address[] memory _voters) public onlyOwner {
        require(elections[_electionId].exists, "Election does not exist.");
        Election storage e = elections[_electionId];
        for (uint i = 0; i < _voters.length; i++) {
            address v = _voters[i];
            if (!e.registeredVoters[v]) {
                e.registeredVoters[v] = true;
                e.voters.push(v);
                emit VoterRegistered(_electionId, v);
            }
        }
    }

    // cast a vote by candidate index for a specific election
    function vote(uint _electionId, uint _candidateIndex) public {
        require(elections[_electionId].exists, "Election does not exist.");
        Election storage e = elections[_electionId];
        
        require(block.timestamp >= e.startTime, "Voting has not started yet.");
        require(block.timestamp <= e.endTime, "Voting has ended.");
        
        require(e.registeredVoters[msg.sender], "You are not registered to vote in this election.");
        require(!e.hasVoted[msg.sender], "You have already voted in this election.");
        require(_candidateIndex < e.candidates.length, "Invalid candidate index.");

        e.hasVoted[msg.sender] = true;
        e.votesPerCandidate[_candidateIndex] += 1;
        emit Voted(_electionId, msg.sender, _candidateIndex);
    }

    // getter: number of elections
    function getElectionCount() public view returns (uint) {
        return electionCount;
    }

    // getter: election name
    function getElectionName(uint _electionId) public view returns (string memory) {
        require(elections[_electionId].exists, "Election does not exist.");
        return elections[_electionId].name;
    }

    // getter: candidate names for an election
    function getCandidates(uint _electionId) public view returns (string[] memory) {
        require(elections[_electionId].exists, "Election does not exist.");
        return elections[_electionId].candidates;
    }

    // getter: votes for a candidate index in an election
    function getVotes(uint _electionId, uint _candidateIndex) public view returns (uint256) {
        require(elections[_electionId].exists, "Election does not exist.");
        require(_candidateIndex < elections[_electionId].candidates.length, "Invalid candidate index.");
        return elections[_electionId].votesPerCandidate[_candidateIndex];
    }

    // getter: voters list for an election (owner-only)
    function getVoters(uint _electionId) public view onlyOwner returns (address[] memory) {
        require(elections[_electionId].exists, "Election does not exist.");
        return elections[_electionId].voters;
    }
    
    // getter: election timer
    function getElectionTimer(uint _electionId) public view returns (uint256, uint256) {
        require(elections[_electionId].exists, "Election does not exist.");
        return (elections[_electionId].startTime, elections[_electionId].endTime);
    }

    // small helper to keep require statements compact (not strictly necessary)
    function _votingIdOrCheck(uint _electionId) internal view returns (uint) {
        require(elections[_electionId].exists, "Election does not exist.");
        return _electionId;
    }
}