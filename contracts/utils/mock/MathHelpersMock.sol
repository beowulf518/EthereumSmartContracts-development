pragma solidity 0.5.7;

import "../MathHelpers.sol";


contract MathHelpersMock {

    function getMedian(uint256[] memory data) public pure returns (uint256 median) {
        return MathHelpers.getMedian(data);
    }

    function getAbsArray(int256[] memory data) public pure returns (uint256[] memory absArray) {
        return MathHelpers.getAbsArray(data);
    }

    function subValueFromArray(uint256[] memory data, int256 value) public pure returns (int256[] memory subArray) {
        return MathHelpers.subValueFromArray(data, value);
    }

    function divArrayWithValue(uint256[] memory data, uint256 value) public pure returns (uint256[] memory divArray) {
        return MathHelpers.divArrayWithValue(data, value);
    }

    function mulArrayWithValue(uint256[] memory data, uint256 value) public pure returns (uint256[] memory divArray) {
        return MathHelpers.mulArrayWithValue(data, value);
    }

    function getArraySum(uint256[] memory data) public pure returns (uint256 sum) {
        return MathHelpers.getArraySum(data);
    }

    function removeElementsFromUintArray(uint256[] memory data, uint256[] memory indexesToKeep)
    public pure returns (uint256[] memory dataWithoutElements) {
        return MathHelpers.removeElementsFromUintArray(data, indexesToKeep);
    }
}