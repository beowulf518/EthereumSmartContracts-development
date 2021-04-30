pragma solidity 0.5.7;

import "../registry/RegistryBaseAbstract.sol";


contract BankRegistryBaseAbstract is RegistryBaseAbstract {
    function setMinEquityBalance(uint256 _minEquityBalance) external;
}
