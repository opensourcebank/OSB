pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20, Ownable {
    string public name;
    string public symbol;
    uint32 public decimals;

    constructor() public {
        symbol = "TKA";
        name = "TokenA";
        decimals = 18;

        // 100 * 10^18
        _mint(msg.sender, 100000000000000000000);

        emit Transfer(0x0, msg.sender, 100000000000000000000);
    }
}