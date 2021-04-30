pragma solidity 0.5.7;


library QuickSort {

    function sort(
        uint256[] memory data
    ) public pure returns (
        uint256[] memory sortedArr,
        uint256[] memory sortedIndexesArr
    ) { // solhint-disable-line function-max-lines

        uint256 n = data.length;
        uint256[] memory arr = new uint256[](n);
        uint256[] memory indexesArr = new uint256[](n);
        uint256 i;

        for (i = 0; i < n; i++) {
            arr[i] = data[i];
            indexesArr[i] = i;
        }

        uint256[] memory stack = new uint256[](n+2);

        //Push initial lower and higher bound
        uint256 top = 1;
        stack[top] = 0;
        top = top + 1;
        stack[top] = n-1;

        //Keep popping from stack while is not empty
        while (top > 0) {

            uint256 h = stack[top];
            top = top - 1;
            uint256 m = stack[top];
            top = top - 1;

            i = m;
            uint256 x = arr[h];

            for (uint256 j = m; j < h; j++) {
                if (arr[j] <= x) {
                    //Move smaller element
                    (arr[i], arr[j]) = (arr[j], arr[i]);
                    (indexesArr[i], indexesArr[j]) = (indexesArr[j], indexesArr[i]);
                    i = i + 1;
                }
            }
            (arr[i], arr[h]) = (arr[h], arr[i]);
            (indexesArr[i], indexesArr[h]) = (indexesArr[h], indexesArr[i]);
            uint256 p = i;

            //Push left side to stack
            if (p > m + 1) {
                top = top + 1;
                stack[top] = m;
                top = top + 1;
                stack[top] = p - 1;
            }

            //Push right side to stack
            if (p+1 < h) {
                top = top + 1;
                stack[top] = p + 1;
                top = top + 1;
                stack[top] = h;
            }
        }

        return (
            arr,
            indexesArr
        );
    }

}
