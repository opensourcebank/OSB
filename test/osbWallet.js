const OSBWallet = artifacts.require('./OSBWallet.sol');
const TokenA = artifacts.require('./tokens/TokenA.sol');
const TokenB = artifacts.require('./tokens/TokenB.sol');

const chai = require('chai');
const { assertRevert } = require('../node_modules/openzeppelin-solidity/test/helpers/assertRevert');

const { BigNumber } = web3;
chai.use(require('chai-bignumber')(BigNumber));

// TODO switch to using should for bignumbers

contract('OSBWallet', (accounts) => {
  const owner = accounts[0];
  const user1 = accounts[1];
  const user3 = accounts[3];
  let tokenA;
  let tokenB;
  let osbWallet;
  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    osbWallet = await OSBWallet.deployed();
    const totalSupply = await tokenA.totalSupply();
    await tokenA.transfer(user1, totalSupply / 2, { from: owner });
    await tokenA.transfer(user3, totalSupply / 10, { from: owner });
  });

  it('should start with proper parameters set via constructor', async () => {
    assert.isOk(osbWallet, 'OSBWalletInstance is not Ok');

    const doesTokenExist = await osbWallet
      .whitelistedTokenContracts(tokenA.address);
    assert.isTrue(doesTokenExist, 'TokenA token is not found within whitelisted tokens');

    const liquidityThresholdForERC20 = await osbWallet
      .liquidityThresholdByAddress(tokenA.address);
    assert.equal(liquidityThresholdForERC20, 40, 'liquidity threshold not proper');
  });
  describe('Deposit', () => {
    it('account should be able to deposit TokenA tokens', async () => {
      const depositAmount = 1000;
      await tokenA.approve(osbWallet.address, depositAmount, { from: user1 });
      await osbWallet.deposit(tokenA.address, depositAmount, { from: user1 });

      const tokenABalance = await osbWallet.balanceMap(user1, tokenA.address);
      assert.equal(tokenABalance, depositAmount,
        'balanceMap was not properly updated');

      const liquidTokenA = await osbWallet.liquidFundsByAddress(tokenA.address);
      assert.equal(liquidTokenA, depositAmount,
        'liquidity by address not properly updated');
    });

    it('should fail if token address is not whitelisted', async () => {
      const depositAmount = 1000;
      await tokenB.approve(osbWallet.address, depositAmount, { from: user1 });
      await assertRevert(osbWallet.deposit(tokenB.address, depositAmount, { from: user1 }));
    });

    it('should fail if allowance is not properly set', async () => {
      const depositAmount = 1000;
      await assertRevert(osbWallet.deposit(tokenA.address, depositAmount, { from: user1 }));
    });
  });

  describe('Withdraw', () => {
    it('user with funds should be able to withdraw and state vars should be updated', async () => {
      // withdrawing from the user1 account that had funds deposited in the Deposit tests
	  // so these numbers must be connected to the numbers in that test
	  // not a fan of this, but too lazy to make the tests better ATM
	  const initialTokenAmount = await tokenA.balanceOf(user1);
	  const initialLiquidFunds = await osbWallet.liquidFundsByAddress(tokenA.address);
      const withdrawAmount = 500;
	  await osbWallet.withdraw(tokenA.address, withdrawAmount, { from: user1 });

	  const updatedTokenAmount = await tokenA.balanceOf(user1);
	  updatedTokenAmount.should.be.bignumber.equal(initialTokenAmount.plus(withdrawAmount));

	  const updatedBalance = await osbWallet.balanceMap(user1, tokenA.address);
	  updatedBalance.should.be.bignumber.equal(500);

	  const updatedLiquidFunds = await osbWallet.liquidFundsByAddress(tokenA.address);
	  updatedLiquidFunds.should.be.bignumber.equal(initialLiquidFunds.minus(withdrawAmount));
    });

    it('should fail if the token address is not whitelisted', async () => {
      const withdrawAmount = 10000;
      await assertRevert(osbWallet.withdraw(tokenB.address, withdrawAmount));
    });
    it('should not be able to withdraw more than held by msg.sender system', async () => {
      const noBalance = accounts[2];
      const withdrawAmount = 10000;
      await assertRevert(osbWallet.withdraw(tokenA.address, withdrawAmount, { from: noBalance }));
    });
    it('should fail if there are not enough liquid funds', async () => {
      const depositAmount = 1000;
      const withdrawAmount = 2000;
	  await tokenA.approve(osbWallet.address, depositAmount, { from: user3 });
	  await osbWallet.deposit(tokenA.address, depositAmount, { from: user3 });

	  const tokenABalance = await osbWallet.balanceMap(user3, tokenA.address);
	  assert.equal(tokenABalance, depositAmount,
        'balanceMap was not properly updated');

	  await assertRevert(osbWallet.withdraw(tokenA.address, withdrawAmount, { from: user3 }));
    });
  });
});
