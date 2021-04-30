pragma solidity 0.5.7;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../erc20/ERC20NonCompliantAbstract.sol";


/**
 * @title TokenWrapper
 * @dev Contract used for safe transferring non compatible ERC20 tokens.
   According to article, some ERC20 tokens do not return value for transfer,
   transferFrom, approve functions. TokenWrapper implements safe methods that
   can handle non-compliant tokens. Using assembly we check if method execution
   was successful, even if no value was returned.

 */
contract TokenWrapper {

    using SafeMath for uint256;

    /**
    * Ensure ERC20 token transfer is safe
    *
    * @param  _token    The address of the ERC20 token
    * @param  _to       The address to transfer tokens to
    * @param  _value    The amount to transfer
    */
    function safeTransfer(
        address _token,
        address _to,
        uint256 _value
    )
    external payable
    returns (bool)
    {
        uint256 existingBalance = ERC20NonCompliantAbstract(_token).balanceOf(address(this));
        ERC20NonCompliantAbstract(_token).transfer(_to, _value);

        // Check that transfer returns true or null
        bool checkResult = checkSuccess();
        if (!checkResult) {
            uint256 newBalance = ERC20NonCompliantAbstract(_token).balanceOf(address(this));

            // Check to make sure current balances are as expected
            require(
                newBalance == existingBalance.sub(_value),
                "Invalid balance"
            );
        }

        return true;
    }

    /**
    * Ensure ERC20 token transferFrom is safe
    *
    * @param  _token    The address of the ERC20 token
    * @param  _to       The address to transfer tokens to
    * @param  _from     The address to transfer tokens from
    * @param  _value    The amount to transfer
    */
    function safeTransferFrom(
        address _token,
        address _from,
        address _to,
        uint256 _value
    )
    external payable
    returns (bool)
    {
        uint256 existingBalance = ERC20NonCompliantAbstract(_token).balanceOf(address(_from));
        ERC20NonCompliantAbstract(_token).transferFrom(_from, _to, _value);

        bool checkResult = checkSuccess();
        if (!checkResult) {
            uint256 newBalance = ERC20NonCompliantAbstract(_token).balanceOf(address(_from));

            require(
                newBalance == existingBalance.sub(_value),
                "Invalid balance"
            );
        }

        return true;
    }

    /**
    * Ensure ERC20 token approve is safe
    *
    * @param  _token    The address of the ERC20 token
    * @param  _spender  The address of allowance to be granted to
    * @param  _value    The amount of tokens to be allowed
    */
    function safeApprove(
        address _token,
        address _spender,
        uint256 _value
    )
    external payable
    returns (bool) {
        ERC20NonCompliantAbstract(_token).approve(_spender, _value);

        bool checkResult = checkSuccess();
        if (!checkResult) {
            uint256 newAllowance = ERC20NonCompliantAbstract(_token).allowance(address(this), _spender);

            require(newAllowance == _value, "Invalid allowance");
        }

        return true;
    }

    /**
    * Assembly method that checks if executed ERC20 function was successful.
      In case no value is returned we assume failure and execute more checks
      in calling function.
    */
    function checkSuccess() private pure returns (bool) {
        // default to failure
        uint256 returnValue = 0;

        assembly {
        // check number of bytes returned from last function call
            switch returndatasize()

            // no bytes returned: assume failure, additional check in solidity code
            case 0x0 {
                returnValue := 0
            }

            // 32 bytes returned
            case 0x20 {
            // copy 32 bytes into scratch space
                returndatacopy(0x0, 0x0, 0x20)

            // load those bytes into returnValue
                returnValue := mload(0x0)
            }

            // not sure what was returned: revert
            default {
                revert(0, 0)
            }
        }

        // check if returned value is one or nothing
        return returnValue == 1;
    }
}
