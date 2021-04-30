pragma solidity 0.5.7;

import "./IERC20SecurityBasic.sol";


contract IERC20Security is IERC20SecurityBasic {
    function name() public view returns (string memory);
    function symbol() public view returns (string memory);
    function decimals() public view returns (uint8);
}