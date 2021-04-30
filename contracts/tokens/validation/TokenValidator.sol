pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../access/RoleAware.sol";
import "../../utils/TokenDecimals.sol";


/**
 * @title TokenValidator
 * @dev Contract used for whitelisting tokens used as Bank collateral or loan
 */
contract TokenValidator is RoleAware {
    using TokenDecimals for address;
    using SafeMath for uint256;

    struct Precision {
        uint256 precision;
        uint256 toTokenPower;
    }

    mapping(address => bool) internal whiteListedTokens; // bank tokens
    mapping(address => bool) internal ccpWhiteListedTokens; // ccp tokens
    mapping(address => Precision) internal ccpPrecisions;

    event TokenWhitelisted(
        address whitelistedToken
    );

    event TokenRemovedFromWhitelist(
        address deletedToken
    );

    event CcpTokenWhitelisted(
        address indexed whitelistedToken,
        uint256 precision,
        uint256 toTokenPower
    );

    event CcpTokenRemovedFromWhitelist(
        address deletedToken
    );

    /**
     * @dev Constructor setting RoleManager contract
       @param roleManager address of RoleManager contract
     */
    constructor(address roleManager) public {
        setRoleManager(roleManager);
    }

    /**
     * @dev Function to check if tokens can be used as Bank collateral or loan
       @param tokens array of tokens to be checked
     */
    function validateTokens(address[] memory tokens) public view {
        for (uint256 i = 0; i < tokens.length; i++) {
            validateToken(tokens[i]);
        }
    }

    /**
     * @dev Function to check if token can be used in ccp as deposit in FundLock
       @param token address of token to be checked
     */
    function validateToken(address token) public view {
        require(whiteListedTokens[token], "Token is not whitelisted");
    }

    function validateCcpTokens(address[] memory tokens) public view {
        for (uint256 i = 0; i < tokens.length; i++) {
            validateCcpToken(tokens[i]);
        }
    }

    /**
     * @dev Function to check if token can be used in ccp as deposit in FundLock
       @param token address of token to be checked
     */
    function validateCcpToken(address token) public view {
        require(ccpWhiteListedTokens[token], "Token is not whitelisted");
    }

    function getCcpPrecision(
        address token
    ) public view returns(
        uint256 precision,
        uint256 toTokenPower
    ) {
        validateCcpToken(token);
        Precision memory precisionObject = ccpPrecisions[token];
        precision = precisionObject.precision;
        toTokenPower = precisionObject.toTokenPower;
    }

    /**
     * @dev Function to add addresses of tokens to be whitelisted for trading
       @param tokens array of tokens addresses to be added to TokenValidator's whitelist
     */
    function addTokensToWhitelist(address[] memory tokens) public onlyAdmin {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Whitelisted token address is not set");
            whiteListedTokens[tokens[i]] = true;
            emit TokenWhitelisted(tokens[i]);
        }
    }

    /**
     * @dev Function to remove token address from TokenValidator whitelist
       @param token address of token to be removed from TokenValidator whitelist
     */
    function removeTokenFromWhitelist(address token) public onlyAdmin {
        require(token != address(0), "Whitelisted token address is not set");
        whiteListedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }

    /**
     * @dev Function to add addresses of tokens to be whitelisted for ccp
       @param tokens array of tokens addresses to be added to TokenValidator's whitelist
     */
    function addTokensToCcpWhitelist(
        address[] memory tokens,
        uint256[] memory precisions
    ) public onlyAdmin {
        require(tokens.length == precisions.length, "Tokens array and precisions array have different lengths");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Whitelisted token address is not set");
            if (!ccpWhiteListedTokens[tokens[i]]) {
                uint256 decimals = tokens[i].getTokenDecimals();
                require(
                    decimals >= precisions[i],
                    "Precision can not be larger than token decimals"
                );
                ccpWhiteListedTokens[tokens[i]] = true;
                uint256 toTokenPower = decimals.sub(precisions[i]);
                ccpPrecisions[tokens[i]] = Precision({
                    precision: precisions[i],
                    toTokenPower: toTokenPower
                });
                emit CcpTokenWhitelisted(
                    tokens[i],
                    precisions[i],
                    toTokenPower
                );
            }
        }
    }

    /**
     * @dev Function to remove token address from TokenValidator whitelist
       @param token address of token to be removed from TokenValidator whitelist
     */
    function removeTokenFromCcpWhitelist(address token) public onlyAdmin {
        require(token != address(0), "Whitelisted token address is not set");
        require(ccpWhiteListedTokens[token] == true, "Can not remove token that is not in the whitelist");
        ccpWhiteListedTokens[token] = false;
        ccpPrecisions[token].precision = 0;
        ccpPrecisions[token].toTokenPower = 0;
        emit CcpTokenRemovedFromWhitelist(token);
    }
}
