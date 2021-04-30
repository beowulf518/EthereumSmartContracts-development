pragma solidity 0.5.7;

import "../backward-compatibility/AddressPayable.sol";


contract QtumEscrow {
    using AddressPayable for address;

    uint256 public constant BASE_MULTIPLIER = 10 ** 18;
    uint256 public supply = 0;

    function purchase() public payable {
        uint256 amount = msg.value * BASE_MULTIPLIER;
        supply = supply + amount;
    }

    function transfer(address to, uint256 amount) public {
        require(amount < supply);
        to.toPayable().transfer(amount / BASE_MULTIPLIER);
    }
}
