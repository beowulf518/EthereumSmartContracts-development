pragma solidity 0.5.7;


contract ERC1644Storage {
    // Address of the controller which is a delegated entity
    // set by the issuer/owner of the token
    address public controller;
    bool public controllable;
}
