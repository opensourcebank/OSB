pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

// needs to be pausible
contract OSBWallet is Pausable, Ownable {
    using SafeMath for uint256;
    // address public tradingContract;
    // address public daoCotnract;

    mapping (address => bool) public whitelistedTokenContracts;
    // liquid funds ?? mapping ??
    mapping (address => uint256) public liquidFundsByAddress;
    // liquid threshold - default 40%
    mapping (address => uint256) public liquidityThresholdByAddress;

    mapping (address => mapping(address => uint256)) public balanceMap;

    // Events //

    event Deposit(
        address indexed from,
        address indexed token,
        uint256 amount
    );

    event Withdraw(
        address indexed owner,
        address indexed token,
        uint256 amount
    );
    // interest disseminated event

    // constructor function should boostrap the initial amount of funds
    // so people can deposit without getting barred by the deposit limit
    constructor(
        address initialWhiteListedToken,
        uint256 initialTokenLiquidityThreshold
    ) public {
        whitelistedTokenContracts[initialWhiteListedToken] = true;
        liquidityThresholdByAddress[initialWhiteListedToken] = initialTokenLiquidityThreshold;
    }

    // FUNCTION to deposit
    // ? should anyone be able to deposit to an address, even if it's not theirs?
    // would need to take an optional parameter for the address someone would be
    // depositing for
    // ? would this have any vulnerability on the withdraw ?
    // TODO limit deposit amount based on total balance of a token
    function deposit(address _tokenToDeposit, uint256 _amount) public whenNotPaused {
        require(whitelistedTokenContracts[_tokenToDeposit], 'This token address is not supported');
        ERC20 tokenInterface = ERC20(_tokenToDeposit);
        address osbWalletAddress = address(this);
        // check TokenA allowance for this address to be >= amount
        // this check might be redundant since it happens in the ERC20 contract when
        // calling transferFrom
        require(tokenInterface.allowance(msg.sender, osbWalletAddress) >= _amount,
        'not enough allowance to deposit this token');
        tokenInterface.transferFrom(msg.sender, osbWalletAddress, _amount);

        // update balance map and other shit in state
        balanceMap[msg.sender][_tokenToDeposit] = balanceMap[msg.sender][_tokenToDeposit].add(_amount);
        liquidFundsByAddress[_tokenToDeposit] = liquidFundsByAddress[_tokenToDeposit].add(_amount);

        emit Deposit(msg.sender, _tokenToDeposit, _amount);
    }

    // FUNCTION to withdraw
    // NOTE: could be error prone due to the predictability of
    // triggering the tradingContract. Adds complexity to trading contract to
    // reduce predictability
    function withdraw(address _tokenToWithdraw, uint256 _amount) public {
        require(whitelistedTokenContracts[_tokenToWithdraw], 'This token address is not supported');
        require(balanceMap[msg.sender][_tokenToWithdraw] >= _amount, 'insufficient funds');
        // TODO: statement below could have race conditions where 2 withdraws happen within the
        // same block
        require(liquidFundsByAddress[_tokenToWithdraw] >= _amount,
        'not enough liquidity to withdraw');

        ERC20 tokenInterface = ERC20(_tokenToWithdraw);
        require(tokenInterface.transfer(msg.sender, _amount), 'token transfer failed');

        balanceMap[msg.sender][_tokenToWithdraw] = balanceMap[msg.sender][_tokenToWithdraw].sub(_amount);
        liquidFundsByAddress[_tokenToWithdraw] = liquidFundsByAddress[_tokenToWithdraw].sub(_amount);
        emit Withdraw(msg.sender, _tokenToWithdraw, _amount);
    }

    // FUNCTION to whitelist token
    // called by DAO

    // FUNCTION to potentially trigger investing
    // For DAO to ping and check the liquidity threshold and determine
    // whether or not to invest more funds


}