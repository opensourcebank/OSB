const config = require('../deployConfig');

const TokenA = artifacts.require('./tokens/TokenA.sol');
const TokenB = artifacts.require('./tokens/TokenB.sol');
const OSBWallet = artifacts.require('./OSBWallet.sol');
const OSBDAO = artifacts.require('./OSBDAO.sol');


module.exports = (deployer, network, accounts) => {
  // should we remove the initial pauser of the contract?
  // or should the original owner be able to in order to move quickly

  // const deployingFrom = accounts[0];
  let foundingMembers = config.members;
  if (network === 'test') {
    // In testing, the first two accounts will be members
    foundingMembers = accounts.slice(0, 2);
  }

  deployer.then(async () => {
    const tokenA = await deployer.deploy(TokenA);
    await deployer.deploy(TokenB);
    // deploy OSBWallet with an inital white listed token
    const wallet = await deployer.deploy(OSBWallet,
      tokenA.address,
      config.liquidityThreshold);
    const osbDao = await deployer.deploy(OSBDAO,
      wallet.address,
      foundingMembers);

    wallet.addPauser(osbDao.address);
    // wallet.renouncePauser(deployingFrom);
  });
};
