pragma solidity 0.5.7;


library RequireStrings {
    function toString(bytes32 self) internal pure returns (string memory) {
        string memory ret = new string(32);
        assembly {
            mstore(add(ret, 32), self)
        }
        return ret;
    }
}