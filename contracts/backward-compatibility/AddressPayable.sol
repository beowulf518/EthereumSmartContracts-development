pragma solidity 0.5.7;


library AddressPayable {
    function toPayable(address addr) internal pure returns (address payable) {
        return address(uint160(addr));
    }
}