//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/TreasuryVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Deploy script for SentinelDAO on Arc Testnet
 * @dev Uses Circle's native USDC on Arc Testnet (not MockUSDC)
 * 
 * Arc Testnet Details:
 * - Chain ID: 5042002
 * - RPC: https://arc-testnet.drpc.org
 * - USDC Address: 0x3600000000000000000000000000000000000000
 * - Block Explorer: https://testnet.arcscan.app/
 * 
 * IMPORTANT: Get testnet USDC from Circle's faucet at https://faucet.circle.com/
 * 
 * Usage:
 * forge script script/DeploySentinelArc.s.sol --rpc-url arc_testnet --broadcast --verify
 */
contract DeploySentinelArc is ScaffoldETHDeploy {
    // Circle's native USDC on Arc Testnet
    address constant ARC_TESTNET_USDC = 0x3600000000000000000000000000000000000000;
    
    function run() external ScaffoldEthDeployerRunner {
        // Verify we're on Arc Testnet
        require(block.chainid == 5042002, "Must run on Arc Testnet (chain ID 5042002)");
        
        console.log("Deploying SentinelDAO to Arc Testnet...");
        console.log("Using Circle USDC at:", ARC_TESTNET_USDC);
        console.log("Deployer:", deployer);
        
        // Deploy TreasuryVault with Arc Testnet USDC
        TreasuryVault vault = new TreasuryVault(ARC_TESTNET_USDC);
        console.log("TreasuryVault deployed at:", address(vault));
        
        // Set deployer as agent initially (can be changed via UI later)
        vault.setAgent(deployer);
        console.log("Agent set to deployer:", deployer);
        
        // Check deployer's USDC balance
        IERC20 usdc = IERC20(ARC_TESTNET_USDC);
        uint256 deployerBalance = usdc.balanceOf(deployer);
        console.log("Deployer USDC balance:", deployerBalance);
        
        if (deployerBalance > 0) {
            console.log("You can fund the treasury via the dashboard UI");
        } else {
            console.log("WARNING: No USDC balance. Get testnet USDC from https://faucet.circle.com/");
        }
        
        // Export contract addresses for frontend
        // Note: We use the real USDC address, not a deployed MockUSDC
        deployments.push(Deployment({ name: "MockUSDC", addr: ARC_TESTNET_USDC }));
        deployments.push(Deployment({ name: "TreasuryVault", addr: address(vault) }));
        
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Network: Arc Testnet");
        console.log("USDC:", ARC_TESTNET_USDC);
        console.log("TreasuryVault:", address(vault));
        console.log("Block Explorer:", "https://testnet.arcscan.app/");
        console.log("");
        console.log("Next steps:");
        console.log("1. Get testnet USDC from https://faucet.circle.com/");
        console.log("2. Update frontend to use Arc Testnet");
        console.log("3. Fund treasury via dashboard");
        console.log("4. Create and execute policies");
    }
}
