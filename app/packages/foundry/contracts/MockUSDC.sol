//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A mock USDC token for testing with 6 decimals
 * @dev Allows owner to mint and includes a public faucet for convenience
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {}

    /**
     * @notice Returns 6 decimals to match real USDC
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Mint tokens to a specific address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in base units, 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for demo convenience - anyone can mint to themselves
     * @param amount Amount of tokens to mint (in base units, 6 decimals)
     */
    function faucetMint(uint256 amount) external {
        require(amount <= 1000 * 10 ** _DECIMALS, "Max 1000 USDC per faucet mint");
        _mint(msg.sender, amount);
    }
}
