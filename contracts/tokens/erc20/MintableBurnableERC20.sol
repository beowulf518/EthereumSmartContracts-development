pragma solidity 0.5.7;


import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";


// solhint-disable-next-line no-empty-blocks
contract MintableBurnableERC20 is ERC20Mintable, ERC20Burnable {}
