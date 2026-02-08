//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/TreasuryVault.sol";

/**
 * @notice Deploy script for SentinelDAO contracts
 * @dev Deploys MockUSDC and TreasuryVault
 * Example:
 * yarn deploy --file DeploySentinel.s.sol  # local anvil chain
 * yarn deploy --file DeploySentinel.s.sol --network sepolia # live network
 */
contract DeploySentinel is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy MockUSDC
        MockUSDC mockUsdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(mockUsdc));

        // Deploy TreasuryVault with MockUSDC address
        TreasuryVault vault = new TreasuryVault(address(mockUsdc));
        console.log("TreasuryVault deployed at:", address(vault));

        // Set deployer as agent initially (can be changed via UI later)
        vault.setAgent(deployer);
        console.log("Agent set to deployer:", deployer);

        // Mint some USDC to deployer for testing (10,000 USDC with 6 decimals)
        uint256 initialMint = 10_000 * 10 ** 6;
        mockUsdc.mint(deployer, initialMint);
        console.log("Minted 10,000 USDC to deployer");

        // Optional: Fund treasury with initial amount for convenience
        // Approve vault to spend USDC
        mockUsdc.approve(address(vault), 5_000 * 10 ** 6);
        // Fund treasury with 5,000 USDC
        vault.fundTreasury(5_000 * 10 ** 6);
        console.log("Treasury funded with 5,000 USDC");

        // Export contract addresses for frontend
        deployments.push(Deployment({ name: "MockUSDC", addr: address(mockUsdc) }));
        deployments.push(Deployment({ name: "TreasuryVault", addr: address(vault) }));
    }
}
