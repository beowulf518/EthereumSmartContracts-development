pragma solidity 0.5.7;

/**
@title  DateKeeper
@author Petr Kosikhin
@dev    Contract responsible for all date validation operations.
*/

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./DateKeeperAbstract.sol";
import "../access/RoleAware.sol";
import "./validation/AbstractValidator.sol";


contract DateKeeper is RoleAware, DateKeeperAbstract {
    using SafeMath for uint256;

    AbstractValidator[] private validators;

    constructor(address _roleManager, address[] memory validatorsAddresses) public {
        setRoleManager(_roleManager);
        for (uint256 i = 0; i < validatorsAddresses.length; i++) {
            addValidator(validatorsAddresses[i]);
        }
    }

    function addValidators(address[] calldata validatorsAddresses) external onlyGovernor {
        for (uint256 i = 0; i < validatorsAddresses.length; i++) {
            addValidator(validatorsAddresses[i]);
        }
    }

    function validate(uint256[4] calldata validationParams) external view returns (bool) {
        for (uint256 i = 0; i < validators.length; i++) {
            if (
                validators[i].validateLddDates(
                    validationParams[0],
                    validationParams[1],
                    validationParams[2],
                    validationParams[3]
                )
            ) {
                return true;
            }
        }

        return false;
    }

    function getValidator(uint256 index) external view returns (address) {
        return address(validators[index]);
    }

    function getValidatorInfo() external view returns (
        address[] memory,
        AbstractValidator.ValidatorType[] memory,
        bytes memory
    // solhint-disable-next-line function-max-lines
    ) {
        address[] memory validatorAddresses = new address[](validators.length);
        AbstractValidator.ValidatorType[] memory validatorTypes = new AbstractValidator.ValidatorType[](
            validators.length
        );

        bytes32[] memory validatorPtrsArr = new bytes32[](
            validators.length
        ); // array of validatorState pointers.
        uint256 totalLength;

        bytes32 validatorSigPtr;
        assembly {
            let freeMemPtr := mload(0x40)
            mstore(freeMemPtr, 0xd14c8537) // bytes4 keccak256 sig of "getValidatorState()"
            validatorSigPtr := freeMemPtr
            mstore(0x40, add(freeMemPtr, 0x20))
        }

        for (uint256 i = 0; i < validators.length; i++) {
            address currentValAddress = address(validators[i]);
            validatorAddresses[i] = currentValAddress;
            validatorTypes[i] = validators[i].VALIDATOR_TYPE();
            assembly {
                let result := staticcall(
                    gas,
                    currentValAddress,
                    add(validatorSigPtr, 28),
                    4,
                    mload(0x40),
                    0
                ) // call getValidatorState() of validator with 0 size memory
                // to copy the returndata since its size is unknown yet.
                if eq(result, 0) {revert(0, 0)}

                let freeMem := mload(0x40)
                returndatacopy(
                    freeMem,
                    0x20,
                    sub(returndatasize, 0x20)
                ) // copy return data skipping first word as it is a ptr to
                // payload start
                mstore(
                    add(
                        add(
                            validatorPtrsArr,
                            32 // offset to first element
                        ),
                        mul(i, 32) // element offset
                    ), // ptr to element in validatorPtrsArr array
                    freeMem // store ptr to return data start
                )
                totalLength := add(
                    add(
                        totalLength,
                        mload(freeMem)
                    ),
                    32
                ) // the total size is size of each array + 32 bytes per
                // each array to store inner array sizes in the resulting
                // output array for parsing purposes.

                mstore(
                    0x40,
                    add(
                        freeMem, // old pointer to free memory
                        // which as of now holds data that we dont
                        // want to overwrite
                        add(
                            mload(freeMem), // length of current array
                            // returned by one of the validators
                            0x20 // 1 word for size of array returned
                            // by one of the validators
                        )
                    )
                ) // increment free memory pointer to point to
                // unused memory. This is needed in order to make sure
                // that we dont overwrite one of the returned validatorStates
                // arrays and that pointer to it stored in validatorPtrsArr
                // would not become dangling in subsequent loop iterations
            }
        }

        // writing to main array from validator ones
        bytes memory validatorStates = new bytes(totalLength);
        uint256 validatorStatesOffset; // offset in validatorStates array
        for (uint256 i = 0; i < validators.length; i++) {
            assembly {
                let arrPtr := mload(
                    add(
                        add(
                            validatorPtrsArr, // pointer to validator pointers array size
                            mul(i, 32) // offset to validator pointers array element
                        ),
                        32 // offset to get to first element of array pointers
                        // array
                    )
                ) // pointer to validatorState array for one of the validators
                let currentLength := add(mload(arrPtr), 0x20) // full length of inner array with its size
                for
                { let innerOffset := 0 }
                lt(innerOffset, currentLength)
                { innerOffset:= add(innerOffset, 0x20) } {
                    mstore(
                        add(
                            add(
                                validatorStatesOffset, // current offset in validatorStates
                                validatorStates // pointer to validatorStates size
                            ),
                            32 // offset to first element of validatorStates
                        ), // store in validatorStatesArray at offset
                        mload(
                            add(
                                arrPtr, // pointer to array size under copy
                                innerOffset // offset for inner array under copy
                            ) // pointer to current validatorState array's element or its size
                        )
                    )
                    validatorStatesOffset := add(validatorStatesOffset, 32)
                }
            }
        }

        return (validatorAddresses, validatorTypes, validatorStates);
    }

    function validateExpirationDate(uint256 expirationDate) public view returns (bool) {
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i].validateExpirationDate(expirationDate)) {
                return true;
            }
        }

        return false;
    }

    function addValidator(address validatorAddress) internal {
        require(validatorAddress != address(0), "Validator address cannot be empty");
        validators.push(AbstractValidator(validatorAddress));
    }
}
