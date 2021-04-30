pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../access/RoleAware.sol";


/**
 * @title Resolver
 * @dev Contract is used to stored mapping between keccak signatures and address of deployed
        contract. It is used by router to resolve and call correct contract address.
        Full keccak is stored to allow for signature address update but not allow to
        override contract address when signatures have the same(collision) 4 bytes of keccak.
 */
contract Resolver is RoleAware {
    using SafeMath for uint256;

    // mapping between first 4 bytes of keccak and contract address
    mapping (bytes4 => address) public pointers;
    // mapping between first 4 bytes of keccak and full keccak, needed to handle
    // signature collision when registering new signatures
    mapping (bytes4 => bytes32) public keccaks;

    event SignatureRegistered(
        bytes32 keccakSignature,
        address destination
    );

    event SignatureRemoved(
        bytes32 keccakSignature
    );

    /**
     * @dev Constructor setting RoleManager contract
       @param roleManager address of RoleManager contract
     */
    constructor(address roleManager) public {
        setRoleManager(roleManager);
    }

    /**
     * @dev Function to register mapping of multiple signature to
            corresponding addresses destinations
       @param keccakSignatures array of signatures to be registered
       @param destinations array of contract addresses that signatures will point to
     */
    function bulkRegister(
        bytes32[] memory keccakSignatures,
        address[] memory destinations
    ) public onlyGovernor {
        require(
            keccakSignatures.length == destinations.length,
            "keccak signatures should have same length as destinations"
        );

        for (uint256 i = 0; i < keccakSignatures.length; i++) {
            register(keccakSignatures[i], destinations[i]);
        }
    }

    /**
     * @dev Function to register single signature to address mapping
       @param keccakSignature signature to be registered
       @param destination contract address that signature will point to
     */
    function register(bytes32 keccakSignature, address destination) public onlyGovernor {
        bytes4 sig = bytes4(keccakSignature);
        require(keccaks[sig] == "" || keccakSignature == keccaks[sig], "Signature conflict");

        pointers[sig] = destination;
        keccaks[sig] = keccakSignature;

        emit SignatureRegistered(
            keccakSignature,
            destination
        );
    }

    /**
     * @dev Function to remove single signature
       @param keccakSignature signature to be removed
     */
    function removeSignature(bytes32 keccakSignature) public onlyGovernor {
        bytes4 sig = bytes4(keccakSignature);
        if (keccaks[sig] != "") {
            pointers[sig] = address(0);
            keccaks[sig] = "";
        }

        emit SignatureRemoved(keccakSignature);
    }

    /**
     * @dev View to check address of contract for given signature
       @param sig first 4 bytes of keccak signature
     */
    function lookup(bytes4 sig) public view returns(address) {
        return pointers[sig];
    }

    /**
     * @dev Converts string signature to first 4 bytes of keccak signature
       @param signature string signature
     */
    function stringToSig(string memory signature) public pure returns(bytes4) {
        return bytes4(keccak256(abi.encodePacked(signature)));
    }
}
