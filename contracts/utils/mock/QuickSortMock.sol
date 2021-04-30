pragma solidity 0.5.7;

import "../QuickSort.sol";


contract QuickSortMock {
    // solhint-disable-next-line no-empty-blocks
    constructor() public {}

    function sortMock(
        uint256[] memory data
    )
    public
    pure
    returns (uint256[] memory, uint256[] memory) {
        (
        uint256[] memory sortedArr,
        uint256[] memory sortedIdxesArr
        ) = QuickSort.sort(
            data
        );
        return (sortedArr, sortedIdxesArr);
    }
}
