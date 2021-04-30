pragma solidity 0.5.7;

import "../access/RoleAware.sol";


contract CompanyMapper is RoleAware {
    event MappingAdded(
        address trader,
        address[] investors
    );

    mapping(address => address[]) private traderToInvestors;

    constructor(address roleManager) public {
        setRoleManager(roleManager);
    }

    function addTraderToInvestorsMapping(
        address trader,
        address[] calldata investors
    ) external onlyUserWhitelistAdmin {
        traderToInvestors[trader] = investors;

        emit MappingAdded(trader, investors);
    }

    function getInvestorsForTrader(
        address trader
    ) public view returns (address[] memory) {
        return traderToInvestors[trader];
    }
}
