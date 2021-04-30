pragma solidity 0.5.7;


contract BankEventEmitterTransferPartialAbstract {
    function emitTransfer(
        address _bank,
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);
}