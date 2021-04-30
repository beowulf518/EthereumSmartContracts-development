import { setupResolver } from '../../../delegate/helpers/setup-resolver';
import {
  contractInstanceAt,
  strip0x,
  add0x,
} from '@nomisma/nomisma-smart-contract-helpers';

const ERC1410 = artifacts.require('./ERC1410.sol');
const ERC1594 = artifacts.require('./ERC1594.sol');
const ERC1644 = artifacts.require('./ERC1644.sol');
const ERC20Security = artifacts.require('./ERC20Security.sol');
const ERC1410Extended = artifacts.require('./ERC1410Extended.sol');
const ERC1400Permissions = artifacts.require('./ERC1400Permissions');
const ERC1400Router = artifacts.require('./ERC1400Router.sol');
const ERC1400Interface = artifacts.require('./IERC1400.sol');


export const toBytes32 = hex => `0x${strip0x(hex)}${ '0'.repeat(66 - hex.length) }`;
/**
 * Converts ascii string to solidity bytes32 type.
 * Right pads the string to bytes32 as solidity would expect.
 *
 * I.e.:
 *
 * ```solidity
 * bytes32 public constant SOME = 'some string'
 * ```
 *
 * would have the same value as `stringToBytes32('some string')`
 * @param str {String}
 * @returns {string}
 */
export const stringToBytes32 = str => toBytes32(web3.utils.asciiToHex(str));

export const EMPTY = web3.utils.fromAscii('');
export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
export const PARTITION1 = toBytes32(web3.utils.fromAscii('partition1'));
export const PARTITION2 = toBytes32(web3.utils.fromAscii('partition2'));
export const PARTITION3 = toBytes32(web3.utils.fromAscii('partition3'));
export const INCORRECT_PARTITION = toBytes32(web3.utils.fromAscii('incorrectPartitionMarker'));
export const VALUE = 1000;

export const ERROR_CODES = {
  NO_PARTITION: {
    errorCode: 0x60,
    errorMessage: 'No active partitions',
  },
  INVALID_PARTITION: {
    errorCode: 0x63,
    errorMessage: 'Partition not found',
  },
  ZEROX_ADDRESS_NOT_ALLOWED: {
    errorCode: 0x50,
    errorMessage: '0x address not allowed',
  },
  MORE_THAN_ONE_ACTIVE_PARTITION: {
    errorCode: 0x61,
    errorMessage: 'More than one partition',
  },
  INVALID_AMOUNT: {
    errorCode: 0x64,
    errorMessage: 'Invalid amount',
  },
  EMPTY_RECEIVER_ADDRESS: {
    errorCode: 0x50,
    errorMessage: '0x address not allowed',
  },
  TRANSFER_OVERFLOW_OR_UNDERFLOW: {
    errorCode: 0x50,
    errorMessage: 'Transfer overflow or underflow',
  },
  INSUFFICIENT_BALANCE: {
    errorCode: 0x52,
    errorMessage: 'Insufficient balance',
  },
  INSUFFICIENT_ALLOWANCE: {
    errorCode: 0x53,
    errorMessage: 'Invalid operator',
  },
  INVALID_SENDER: {
    errorCode: 0x56,
    errorMessage: 'Invalid sender',
  },
  INVALID_RECEIVER: {
    errorCode: 0x57,
    errorMessage: 'Invalid receiver',
  },
  OK_CODE: {
    errorCode: 0x62,
    errorMessage: '',
  },
};

export const toAsciiWithoutPadding = ascii => web3.utils.toAscii(ascii).replace(/\u0000/g, '');

export const setupErc1400 = async ({
  roleManager,
  owner,
  registryAddress,
  name = 'Nomisma security',
  symbol = 'NOM',
  controller = owner,
  controllable = true,
  issuance = true,
  userRoleString = 'ccp.user',
}) => {
  const erc1410 = await ERC1410.new();
  const erc1594 = await ERC1594.new();
  const erc1644 = await ERC1644.new();
  const erc20 = await ERC20Security.new();
  const erc1410Extended = await ERC1410Extended.new();
  const erc1400Permissions = await ERC1400Permissions.new();
  const resolver = await setupResolver(
    [
      erc1410,
      erc1594,
      erc1644,
      erc20,
      erc1410Extended,
      erc1400Permissions,
    ],
    roleManager.address,
    owner
  );
  const erc1400Router = await ERC1400Router.new(
    roleManager.address,
    resolver.address,
    {
      from: owner,
    }
  );

  const erc1400 = await contractInstanceAt(
    ERC1400Interface,
    erc1400Router.address,
  );
  await erc1400.init(
    name,
    symbol,
    controller,
    controllable,
    issuance,
    stringToBytes32(userRoleString),
    registryAddress,
    {
      from: owner,
    }
  );
  return erc1400;
};

export const assertErrorCode = (
  result,
  errorCode,
  messageOverride = null
) => {
  assert.ok(
    Buffer
      .from(
        strip0x(result[0]),
        'hex'
      )
      .equals(
        Buffer.from(
          [errorCode.errorCode]
        )
      ),
    `returned bytecode ${result[0]} does not match expected  ${add0x(Buffer.from(
      [errorCode.errorCode]
    ).toString('hex'))}`
  );
  const message = messageOverride === null ? errorCode.errorMessage : messageOverride;
  assert.equal(
    toAsciiWithoutPadding(
      result[1]
    ),
    message
  );
};
