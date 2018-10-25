pragma solidity ^0.4.24;

import "./OSBWallet.sol";

contract OSBDao {
    uint8 constant SUPER_MAJORITY_NUM = 2;
    uint8 constant SUPER_MAJORITY_DENOM = 3;

    enum Vote {
        Abstain,
        Yes,
        No
    }

    enum ProposalType {
        AddMember,
        RemoveMember
    }

    struct Member {
        address memberAddress;
        bool active;
    }

    struct Proposal {
        bool active;
        ProposalType proposalType;
        address owner;
        address proposee;
        uint32 yesVotes;
        uint32 noVotes;
        uint32 abstainees;
    }

    // reference to wallet contract
    OSBWallet public wallet;
    // reference to trading contract

    // VALUE member stake threshold
    // proposed members must have this amount of specified token within

    mapping (address => Member) public members;
    Proposal[] public proposals;

    // Events
    event AddMember(
        address indexed currentMember,
        address newMember
    );

    // Modifiers

    // onlyActiveMember
    modifier onlyActiveMember {
        require(members[msg.sender].active, 'Not an active member');
        _;
    }

    // constructor - set up the founding members addresses
    constructor(address osbWalletAddress, address[] foundingMembers) public {
        wallet = OSBWallet(osbWalletAddress);
        for (uint i = 0; i < foundingMembers.length; i++) {
            _addMember(foundingMembers[i]);
        }
    }

    // Functions

    function _addMember(address memberAddress) internal {
        require(!members[memberAddress].active, 'dupe member');
        members[memberAddress] = Member(memberAddress, true);
    }

    // FUNCTION removeMember internal
    // similar proposal process, but need to make sure that this does not
    // have any issues with malicious members

    // FUNCTION proposeMember
    // TODO check to make sure proposed address has qualified staking amount
    // opens the proposal for voting
    function proposeMemberAction(address proposedMember, uint8 proposalType) public onlyActiveMember {
        require(members[proposedMember].memberAddress == 0x0, 'Member already exists');
        ProposalType typeOfProposal = ProposalType(proposalType);
        Proposal memory proposal = Proposal(true, typeOfProposal, msg.sender, proposedMember, 0, 0, 0);
        proposals.push(proposal);
    }

    // FUNCTION processProposals


    // WALLET FUNCTIONS

    // FUNCTION pauseDepositing into wallet contract
    // TODO ? make this function require multisig ?
    function pauseWallet() {
        wallet.pause();
    }

    // FUNCTION changeMemberStakeThreshold **multisig

    // FUNCTION whiteListToken ** multisig
    // ping OSBWallet and add a token to the white list


    // FUNCTION changeLiquidityThreshold ** multisig
    // adjust the liquidity threshold in the wallet contract

    // AUTO TRADER FUNCTIONS

    // FUNCTION rebalanceFunds **multisig
    // ping the wallet contract to check liquidity and potentially trade
    // funds that exceed liquidity threshold

    // FUNCTION pauseAutotrader
}
