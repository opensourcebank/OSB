const OSBWallet = artifacts.require('./OSBWallet.sol');
const OSBDAO = artifacts.require('./OSBDAO.sol');

const chai = require('chai');
const { assertRevert } = require('../node_modules/openzeppelin-solidity/test/helpers/assertRevert');

const { BigNumber } = web3;
chai.use(require('chai-bignumber')(BigNumber));


const ADD_MEMBER = 0;
const REMOBE_MEMBER = 1;
const PROPOSAL_TYPE = [ADD_MEMBER, REMOBE_MEMBER];
contract('OSBDAO', (accounts) => {
  const member0 = accounts[0];
  const member1 = accounts[1];
  let osbWalletInstance;
  let osbDao;

  before(async () => {
    osbWalletInstance = await OSBWallet.deployed();
    osbDao = await OSBDAO.deployed();
  });

  describe('proposeMemberAction', () => {
    it('should start with proper parameters set via constructor', async () => {
      assert.isOk(osbDao, 'OSBDAO is not Ok');

      const walletAddress = await osbDao.wallet();
      assert.equal(walletAddress, osbWalletInstance.address,
        'wallet addresses were not equal');

      const osbMember0 = await osbDao.members(member0);
      const osbMember1 = await osbDao.members(member1);
      assert.equal(osbMember0[0], member0, 'address not equal');
      assert.isTrue(osbMember0[1], 'founding member is not active');
      assert.equal(osbMember1[0], member1, 'address not equal');
      assert.isTrue(osbMember1[1], 'founding member is not active');
    });

    it('should create a proposal for potential member', async () => {
      const proposedMember = accounts[3];
      await osbDao.proposeMemberAction(proposedMember, ADD_MEMBER, { from: member1 });

      const proposal = await osbDao.proposals(0);
      assert.isTrue(proposal[0], 'new proposal is not active');
      proposal[1].should.be.bignumber.equal(PROPOSAL_TYPE[0]);
      assert.equal(proposal[2], member1, 'proposal owner incorrect');
      assert.equal(proposal[3], proposedMember, 'proposee is incorrect');
      proposal[4].should.be.bignumber.equal(0);
      proposal[5].should.be.bignumber.equal(0);
      proposal[6].should.be.bignumber.equal(0);
    });

    it('should fail to propose from non member address', async () => {
      await assertRevert(osbDao.proposeMemberAction(accounts[4], ADD_MEMBER, { from: accounts[2] }));
    });

    it('should fail to propose an existing member', async () => {
      await assertRevert(osbDao.proposeMemberAction(member0, ADD_MEMBER, { from: member1 }));
    });
  });

  describe('OSBWallet Controls', () => {
    it('should be able to pause OSBWallet and hault deposits', async () => {
      assert.isTrue(false, 'write this test');
    });
  });
});
