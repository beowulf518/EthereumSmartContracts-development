pragma solidity 0.5.7;


contract ERC1400ErrorCodes {
    byte public constant TRANSFER_FAILURE = 0x50; // Transfer Verified - Unrestricted
    byte public constant TRANSFER_SUCCESS = 0x51; // Transfer Verified - On-Chain approval for restricted token
    byte public constant INSUFFICIENT_BALANCE = 0x52; // Transfer Verified - Off-Chain approval for restricted token
    byte public constant INSUFFICIENT_ALLOWANCE = 0x53; // Transfer Blocked - Sender lockup period not ended
    byte public constant TRANSFER_HALTED = 0x54; // Transfer Blocked - Sender balance insufficient
    byte public constant FUNDS_LOCKED = 0x55; // Transfer Blocked - Sender not eligible
    byte public constant INVALID_SENDER = 0x56; // Transfer Blocked - Receiver not eligible
    byte public constant INVALID_RECEIVER = 0x57; // Transfer Blocked - Identity restriction
    byte public constant INVALID_OPERATOR = 0x58; // Transfer Blocked - Token restriction

    byte public constant NO_ACTIVE_PARTITIONS = 0x60;
    byte public constant MORE_THAN_ONE_PARTITION = 0x61;
    byte public constant OK_CODE = 0x62;
    byte public constant INVALID_PARTITION = 0x63;
    byte public constant INVALID_AMOUNT = 0x64;
}