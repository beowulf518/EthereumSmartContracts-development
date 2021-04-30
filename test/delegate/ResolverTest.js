import {
  revert as EVMRevert,
} from 'truffle-test-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .should();

import {
  sha3,
  configToKeccakSignature,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupRoleManager,
} from '../access/helpers/role-manager';

const Resolver = artifacts.require('./Resolver.sol');
const TokenManagerAdmin = artifacts.require('./TokenManagerAdmin.sol');

contract('Resolver', function ([owner, dest1, dest2]) {
  const collidingSignature = sha3('tgeo()');
  const collidingSignature2 = sha3('gsf()');

  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.resolver = await Resolver.new(this.roleManager.address);
    this.contract = await TokenManagerAdmin.new();
    this.methodNames = ['setBankRegistry', 'setEthereumAddress', 'setTokenWrapper', 'getTokenWrapper',
      'getEthereumAddress'];

    this.keccakSignatures = this.methodNames.map(methodName => {
      const keccakSignature = configToKeccakSignature({contract: this.contract, name: methodName});

      return keccakSignature;
    });

    this.destinations = new Array(this.keccakSignatures.length).fill(this.contract.address);
  });

  it('should bulk register signatures', async function () {
    const resolver = await Resolver.new(this.roleManager.address);
    const contract = await TokenManagerAdmin.new();
    const methodNames = ['issueTokens', 'setEthereumAddress', 'addOpm', 'getBankDebtToken',
      'getBankEquityToken', 'getBankEquityToken', 'getEthereumAddress'];

    const signatures = contract.abi.filter(obj => {
      return methodNames.includes(obj.name);
    }).map(obj => {
      return obj.signature;
    });

    const destinations = new Array(signatures.length).fill(contract.address);
    await resolver.bulkRegister(signatures, destinations);

    for (const signature of signatures) {
      const actualDestination = await resolver.lookup(signature);
      assert.equal(actualDestination, contract.address);
    }
  });

  describe('emits events with appropriate values when registers', function () {
    it('bulkRegister() check', async function () {
      await this.resolver.bulkRegister(this.keccakSignatures, this.destinations);

      const registerEvents = await this.resolver.getPastEvents('SignatureRegistered');
      const address = registerEvents.find(e => e.event === 'SignatureRegistered').args.destination;

      assert.equal(address, this.contract.address);

      const sigs = [];
      for (let i = 0; i < registerEvents.length; i++) {
        const sig = registerEvents[i].args.keccakSignature;
        sigs.push(sig);
        assert.equal(sigs[i], this.keccakSignatures[i]);
      }
    });

    it('register() check', async function () {
      await this.resolver.register(
        this.keccakSignatures[0],
        this.destinations[0]
      );

      const registerEvent = await this.resolver.getPastEvents('SignatureRegistered');
      const addressFromEvent = registerEvent.find(e => e.event === 'SignatureRegistered')
        .args.destination;
      const keccakFromEvent = registerEvent.find(e => e.event === 'SignatureRegistered')
        .args.keccakSignature;

      assert.equal(addressFromEvent, this.destinations[0]);
      assert.equal(keccakFromEvent, this.keccakSignatures[0]);
    });

    it('removeSignature() check', async function () {
      await this.resolver.register(this.keccakSignatures[0], dest1).should.be.fulfilled;
      await this.resolver.removeSignature(this.keccakSignatures[0]);

      const removeEvent = await this.resolver.getPastEvents('SignatureRemoved');
      const keccakFromEvent = removeEvent.find(e => e.event === 'SignatureRemoved')
        .args.keccakSignature;

      assert.equal(this.keccakSignatures[0], keccakFromEvent);
    });
  });

  it('should update same signature destination successfully', async function () {
    await this.resolver.register(this.keccakSignatures[0], dest1);

    let actualDestination = await this.resolver.lookup(this.keccakSignatures[0]);
    assert.equal(actualDestination, dest1);

    await this.resolver.register(this.keccakSignatures[0], dest2);
    actualDestination = await this.resolver.lookup(this.keccakSignatures[0]);
    assert.equal(actualDestination, dest2);
  });

  it('should fail update when signatures collide', async function () {
    await this.resolver.register(collidingSignature, dest1).should.be.fulfilled;
    await this.resolver.register(collidingSignature2, dest2).should.be.rejectedWith(EVMRevert);

    await this.resolver.bulkRegister([collidingSignature], [dest2]).should.be.fulfilled;
    await this.resolver.bulkRegister([sha3('nonCollidingSig()'), collidingSignature2], [dest2, dest2])
      .should.be.rejectedWith(EVMRevert);
  });

  it('should remove signature successfully', async function () {
    await this.resolver.register(collidingSignature, dest1).should.be.fulfilled;
    await this.resolver.register(collidingSignature2, dest2).should.be.rejectedWith(EVMRevert);

    await this.resolver.removeSignature(collidingSignature);
    await this.resolver.register(collidingSignature2, dest2).should.be.fulfilled;
  });
});
