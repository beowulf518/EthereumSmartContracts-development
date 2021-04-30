pragma solidity 0.5.7;


contract RoleNames {
    bytes32 public constant GOVERNOR_ROLE_NAME = "governor"; // super.admin
    bytes32 public constant ADMIN_ROLE_NAME = "admin";
    bytes32 public constant UTILITY_ACCOUNT_ROLE_NAME = "utility.account";
    bytes32 public constant USER_WHITELIST_ADMIN_ROLE_NAME = "user.whitelist.admin";

    //whitelisted user roles
    bytes32 public constant CCP_USER = "ccp.user";
    bytes32 public constant BANK_USER = "bank.user";
    bytes32 public constant PRICE_ORACLE_ACCOUNT_ROLE_NAME = "price.oracle";
}