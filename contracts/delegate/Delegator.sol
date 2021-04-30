pragma solidity 0.5.7;


contract Delegator {

    function delegate(
        address calleeContract,
        bytes memory parameters,
        string memory errorMsg
    ) public returns (bytes memory) {
        assembly {
            let size := extcodesize(calleeContract)
            if iszero(size) { revert(0, 0) }
        }

        (
            bool success,
            bytes memory result
        ) = calleeContract.delegatecall(parameters);

        require(success, errorMsg);
        return result;
    }
}