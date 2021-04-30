const QuickSort = artifacts.require('./QuickSort.sol');
const MathHelpers = artifacts.require('./MathHelpers.sol');

const QuickSortMock = artifacts.require('./QuickSortMock.sol');
const MathHelpersMock = artifacts.require('./MathHelpersMock.sol');
const KindMath = artifacts.require('./KindMath.sol');
const ERC1410Extended = artifacts.require('./ERC1410Extended.sol');

module.exports = async function (deployer) {
  await deployer.deploy(QuickSort);
  await deployer.deploy(KindMath);

  deployer.link(KindMath, ERC1410Extended);
  deployer.link(QuickSort, QuickSortMock);
  deployer.link(QuickSort, MathHelpers);

  await deployer.deploy(MathHelpers);

  deployer.link(MathHelpers, [
    MathHelpersMock,
  ]);
};
