pragma solidity 0.5.7;


library TokenDecimals {
    /**
     * @dev Helper functions that gets decimals property for specified token
     * @param token address of asset to get decimals
     */
    function getTokenDecimals(
        address token
    ) internal view returns (
        uint256 decimals
    ) {
        bytes4 decimalsSig = bytes4(keccak256("decimals()"));
        assembly {
            let freeMem := mload(0x40)
            mstore(freeMem, decimalsSig)
            switch extcodesize(token)
            case 0 {
                decimals := 18
            }
            default {
                let result := staticcall(gas, token, freeMem, 4, add(freeMem, 0x20), 0x20)
                switch result
                case 1 { decimals := mload(add(freeMem, 0x20)) }
                default { decimals := 18 }
            }
            mstore(0x40, add(freeMem, 0x40))
        }
    }
}