//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TreasuryVault
 * @notice Manages DAO treasury with on-chain policies for automated payouts
 * @dev Policies can be one-off or recurring, with optional approval requirements
 */
contract TreasuryVault is Ownable, Pausable {
    struct Policy {
        bool enabled;
        bool requiresApproval;
        bool approved;
        uint64 intervalSeconds; // 0 = one-off
        uint64 nextExecutionTime; // unix timestamp
        uint256 maxPerExecution; // cap on total payout per run
        uint256 executions; // count of executions
        uint256 lastExecutedAt; // timestamp
        address[] recipients;
        uint256[] amounts; // USDC base units (6 decimals)
    }

    IERC20 public immutable usdc;
    address public agent;

    Policy[] private policies;

    // Events with indexed fields for filtering
    event PolicyCreated(
        uint256 indexed id,
        uint64 startTime,
        uint64 intervalSeconds,
        uint256 total,
        bool requiresApproval
    );
    event PolicyEnabledChanged(uint256 indexed id, bool enabled);
    event PolicyApproved(uint256 indexed id);
    event AgentUpdated(address indexed agent);
    event TreasuryFunded(address indexed from, uint256 amount);
    event PolicyExecuted(uint256 indexed id, uint256 total, uint256 executions, uint256 timestamp);

    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent can execute");
        _;
    }

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Returns the total number of policies
     */
    function policyCount() external view returns (uint256) {
        return policies.length;
    }

    /**
     * @notice Get details of a specific policy
     * @param id Policy ID
     */
    function getPolicy(uint256 id)
        external
        view
        returns (
            bool enabled,
            bool requiresApproval,
            bool approved,
            uint64 intervalSeconds,
            uint64 nextExecutionTime,
            uint256 maxPerExecution,
            uint256 executions,
            uint256 lastExecutedAt,
            address[] memory recipients,
            uint256[] memory amounts
        )
    {
        require(id < policies.length, "Policy does not exist");
        Policy storage policy = policies[id];
        return (
            policy.enabled,
            policy.requiresApproval,
            policy.approved,
            policy.intervalSeconds,
            policy.nextExecutionTime,
            policy.maxPerExecution,
            policy.executions,
            policy.lastExecutedAt,
            policy.recipients,
            policy.amounts
        );
    }

    /**
     * @notice Calculate total payout amount for a policy
     * @param id Policy ID
     */
    function totalPerExecution(uint256 id) public view returns (uint256) {
        require(id < policies.length, "Policy does not exist");
        Policy storage policy = policies[id];
        uint256 total = 0;
        for (uint256 i = 0; i < policy.amounts.length; i++) {
            total += policy.amounts[i];
        }
        return total;
    }

    /**
     * @notice Create a new policy
     * @param recipients Array of recipient addresses
     * @param amounts Array of USDC amounts (6 decimals)
     * @param intervalSeconds Interval between executions (0 for one-off)
     * @param startTime Unix timestamp for first execution
     * @param maxPerExecution Maximum total amount per execution
     * @param requiresApproval Whether policy needs approval before execution
     * @return id The created policy ID
     */
    function createPolicy(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint64 intervalSeconds,
        uint64 startTime,
        uint256 maxPerExecution,
        bool requiresApproval
    ) external onlyOwner returns (uint256 id) {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == amounts.length, "Length mismatch");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be > 0");
            total += amounts[i];
        }

        require(maxPerExecution >= total, "maxPerExecution too low");

        Policy memory newPolicy = Policy({
            enabled: true,
            requiresApproval: requiresApproval,
            approved: !requiresApproval, // Auto-approve if no approval required
            intervalSeconds: intervalSeconds,
            nextExecutionTime: startTime,
            maxPerExecution: maxPerExecution,
            executions: 0,
            lastExecutedAt: 0,
            recipients: recipients,
            amounts: amounts
        });

        policies.push(newPolicy);
        id = policies.length - 1;

        emit PolicyCreated(id, startTime, intervalSeconds, total, requiresApproval);
    }

    /**
     * @notice Enable or disable a policy
     * @param id Policy ID
     * @param enabled New enabled state
     */
    function setPolicyEnabled(uint256 id, bool enabled) external onlyOwner {
        require(id < policies.length, "Policy does not exist");
        policies[id].enabled = enabled;
        emit PolicyEnabledChanged(id, enabled);
    }

    /**
     * @notice Approve a policy for execution
     * @param id Policy ID
     */
    function approvePolicy(uint256 id) external onlyOwner {
        require(id < policies.length, "Policy does not exist");
        require(policies[id].requiresApproval, "Policy does not require approval");
        policies[id].approved = true;
        emit PolicyApproved(id);
    }

    /**
     * @notice Set the agent address that can execute policies
     * @param newAgent New agent address
     */
    function setAgent(address newAgent) external onlyOwner {
        require(newAgent != address(0), "Invalid agent address");
        agent = newAgent;
        emit AgentUpdated(newAgent);
    }

    /**
     * @notice Pause the vault (prevents policy execution)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Fund the treasury with USDC
     * @param amount Amount of USDC to deposit (6 decimals)
     */
    function fundTreasury(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        usdc.transferFrom(msg.sender, address(this), amount);
        emit TreasuryFunded(msg.sender, amount);
    }

    /**
     * @notice Execute a policy (only callable by agent)
     * @param id Policy ID
     */
    function executePolicy(uint256 id) external onlyAgent whenNotPaused {
        require(id < policies.length, "Policy does not exist");
        Policy storage policy = policies[id];

        require(policy.enabled, "Policy not enabled");
        require(block.timestamp >= policy.nextExecutionTime, "Not yet time to execute");

        if (policy.requiresApproval) {
            require(policy.approved, "Policy not approved");
        }

        uint256 total = 0;
        for (uint256 i = 0; i < policy.amounts.length; i++) {
            total += policy.amounts[i];
        }

        require(total <= policy.maxPerExecution, "Exceeds max per execution");
        require(usdc.balanceOf(address(this)) >= total, "Insufficient treasury balance");

        // Execute transfers
        for (uint256 i = 0; i < policy.recipients.length; i++) {
            usdc.transfer(policy.recipients[i], policy.amounts[i]);
        }

        // Update policy state
        policy.executions++;
        policy.lastExecutedAt = block.timestamp;

        if (policy.intervalSeconds > 0) {
            // Recurring policy - schedule next execution
            policy.nextExecutionTime = uint64(block.timestamp) + policy.intervalSeconds;
        } else {
            // One-off policy - disable after execution
            policy.enabled = false;
        }

        // Reset approval if required (so next execution needs re-approval)
        if (policy.requiresApproval) {
            policy.approved = false;
        }

        emit PolicyExecuted(id, total, policy.executions, block.timestamp);
    }
}
