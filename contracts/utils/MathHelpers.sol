pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./QuickSort.sol";
import "./Utils.sol";


library MathHelpers {
    using SafeMath for uint256;

    uint256 public constant RAY = 10 ** 27;

    function getMedian(uint256[] memory data) public pure returns (uint256) {
        (
            uint256[] memory sortedArr,
            uint256[] memory sortedIdxesArr
        ) = QuickSort.sort(data);
        require(sortedArr.length == sortedIdxesArr.length);

        uint256 middleIndex = sortedArr.length / 2;

        if (sortedArr.length % 2 == 1) {
            return sortedArr[middleIndex] * 10;
        } else {
            uint256 result = sortedArr[middleIndex - 1] + sortedArr[middleIndex];
            result = divideWithPrecision(result, 2, 1);

            return result;
        }
    }

    function getAbsArray(int256[] memory data) public pure returns (uint256[] memory absArray) {
        uint256 dataSize = data.length;
        absArray = new uint256[](dataSize);
        for (uint256 i = 0; i < dataSize; i++) {
            absArray[i] = getAbsValue(data[i]);
        }

        return absArray;
    }

    function getArraySum(uint256[] memory data) public pure returns (uint256 sum) {
        uint256 dataSize = data.length;
        sum = 0;
        for (uint256 i = 0; i < dataSize; i++) {
            sum = sum.add(data[i]);
        }

        return sum;
    }

    function removeElementsFromAddressArray(address[] memory data, uint256[] memory indexesToKeep)
    public pure returns (address[] memory dataWithoutElements) {
        dataWithoutElements = new address[](indexesToKeep.length);
        uint256 dataWithoutElementsSize = 0;
        for (uint256 i = 0; i < indexesToKeep.length; i++) {
            dataWithoutElements[dataWithoutElementsSize++] = data[indexesToKeep[i]];
        }
    }

    function removeElementsFromUintArray(uint256[] memory data, uint256[] memory indexesToKeep)
    public pure returns (uint256[] memory dataWithoutElements) {

        dataWithoutElements = new uint256[](indexesToKeep.length);
        uint256 dataWithoutElementsSize = 0;
        for (uint256 i = 0; i < indexesToKeep.length; i++) {
            dataWithoutElements[dataWithoutElementsSize++] = data[indexesToKeep[i]];
        }
    }

    function subValueFromArray(uint256[] memory data, int256 value) public pure returns (int256[] memory subArray) {
        uint256 dataSize = data.length;
        subArray = new int256[](dataSize);
        for (uint256 i = 0; i < dataSize; i++) {
            subArray[i] = int256(data[i]) - value;
        }

        return subArray;
    }

    function divArrayWithValue(uint256[] memory data, uint256 value) public pure returns (uint256[] memory divArray) {
        uint256 dataSize = data.length;
        divArray = new uint256[](dataSize);
        for (uint256 i = 0; i < dataSize; i++) {
            divArray[i] = rdiv(data[i], value);
        }

        return divArray;
    }

    function mulArrayWithValue(uint256[] memory data, uint256 value) public pure returns (uint256[] memory mulArray) {
        uint256 dataSize = data.length;
        mulArray = new uint256[](dataSize);
        for (uint256 i = 0; i < dataSize; i++) {
            mulArray[i] = data[i].mul(value);
        }

        return mulArray;
    }

    function getAbsValue(int256 value) public pure returns (uint256) {
        if (value < 0) {
            return uint256(-value);
        } else {
            return uint256(value);
        }
    }

    function divideWithPrecision(uint256 numerator, uint256 denominator, uint256 precision)
    public pure returns (uint256 quotient) {
        uint256 _numerator = numerator * 10 ** (precision + 1);
        uint256 _quotient = ((_numerator / denominator) + 5) / 10;

        return (_quotient);
    }

    function rmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, y), RAY / 2) / RAY;
    }

    function rdiv(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, RAY), y / 2) / y;
    }

    function rpow(uint256 x, uint256 n) internal pure returns (uint256 z) {
        z = n % 2 != 0 ? x : RAY;
        for (n /= 2; n != 0; n /= 2) {
            x = rmul(x, x);
            if (n % 2 != 0) {
                z = rmul(z, x);
            }
        }
    }

    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x);
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x);
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x);
    }
}
