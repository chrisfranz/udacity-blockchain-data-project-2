/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

  constructor() {
    this.bd = new LevelSandbox.LevelSandbox();
    this.generateGenesisBlock();
  }

  // Helper method to create a Genesis Block (always with height= 0)
  // You have two options, because the method will always execute when you create your blockchain
  // you will need to set this up statically or instead you can verify if the height !== 0 then you
  // will not create the genesis block
  async generateGenesisBlock() {
    // Add your code here
    const blockCount = await this.getBlockHeight();

    if (blockCount === -1) {
      const genBlock = new Block.Block('this is the genesis block');
      this.addBlock(genBlock);
    }
  }

  // Get block height, it is a helper method that return the height of the blockchain
  getBlockHeight() {
    return this.bd.getBlocksCount();
  }

  // Add new block
  async addBlock (newBlock) {
    // get number of blocks in store
    const blockCount = await this.getBlockHeight();
    // get previous block hash, assign to newBlock
    if (blockCount > -1) {
      newBlock.height = blockCount + 1;
      let prevBlock = await this.getBlock(blockCount);
      let prevHash = prevBlock.hash;
      newBlock.previousBlockHash = prevHash
    }    
    // assign new block time
    newBlock.time = new Date().getTime().toString().slice(0, -3);
    // hash newBlock
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // save newBlock
    return this.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
  }

  // Get Block By Height
  getBlock(blockHeight) {
    return this.bd.getLevelDBData(blockHeight)
  }

  // Validate if Block is being tampered by Block Height
  async validateBlock(height) {
    // Add your code here
    // get block associated with height
    const block = await this.getBlock(height);
    // make copy of block to re-hash
    const blockCopy = {...block};
    // initialize hash
    blockCopy.hash = '';
    // calculate hash
    const newHash = SHA256(JSON.stringify(blockCopy)).toString();
    // pull hash from existing block
    const { hash } = block;
    
    return new Promise((resolve, reject) => {
      if (hash === newHash) {
        resolve(true)
      } else {
        reject(false);
      }
    })
  }

  // Validate Blockchain
  async validateChain() {
    // Add your code here
      const promises = [];
      const blockHeight = await this.getBlockHeight();
      let link = true;
      // iterate through chain, validating each block
      for (let i = 0; i < blockHeight; i++) {
        const validateResult = await this.validateBlock(i);
        // push result of validation to promises array
        promises.push(validateResult);
        // check that hash of currentBlock is equal to previousBlockHash of next block
        if (i < blockHeight - 1) {
          const block = await this.getBlock(i);
          const hash = block.hash;
          const nextBlock = await this.getBlock(i + 1);
          const nextHash = nextBlock.previousBlockHash;
          if (hash !== nextHash) {
            link = false;
          }
        }
      } 
    // convert results array into single boolean value
    const result = promises.every(el => el);

    return new Promise((resolve, reject) => {
      if (result && link) {
        resolve(true);
      } else {
        reject(false);
      }
    })
  }

  // Utility Method to Tamper a Block for Test Validation
  // This method is for testing purpose
  _modifyBlock(height, block) {
    let self = this;
    return new Promise( (resolve, reject) => {
      self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
        resolve(blockModified);
      }).catch((err) => { console.log(err); reject(err)});
    });
  }
}

module.exports.Blockchain = Blockchain;
