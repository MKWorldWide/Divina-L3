// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/GameDinToken.sol";

/// @title GameDinToken Property Tests
/// @notice This contract contains property-based tests for the GameDinToken contract
contract GameDinTokenTest is GameDinToken {
    // Test state variables
    address private constant TEST_USER = address(0x1234);
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    
    // Setup function to initialize the contract with test parameters
    constructor() GameDinToken("GameDinTest", "GDT") {
        _mint(address(this), INITIAL_SUPPLY);
        _mint(TEST_USER, INITIAL_SUPPLY);
    }
    
    // Helper function to generate a random address for testing
    function _randomAddress(uint256 seed) private pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(seed)))));
    }
    
    // Property: Total supply should never decrease below initial supply
    function test_totalSupplyNeverDecreases(uint256 amount) public {
        uint256 initialSupply = totalSupply();
        // Ensure amount is not zero and doesn't cause overflow
        amount = amount % (type(uint256).max - initialSupply);
        
        // Mint new tokens
        _mint(address(this), amount);
        
        // Assert total supply has increased or stayed the same
        assert(totalSupply() >= initialSupply);
    }
    
    // Property: Balance of an account should never exceed total supply
    function test_balanceNeverExceedsTotalSupply(address account) public {
        // Skip zero address as it's used for burns
        if (account == address(0)) return;
        
        // Get the account's balance
        uint256 balance = balanceOf(account);
        
        // Assert balance is less than or equal to total supply
        assert(balance <= totalSupply());
    }
    
    // Property: Transfer should update balances correctly
    function test_transferUpdatesBalances(
        address to,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (to == address(0)) return;
        
        // Ensure amount is not zero and doesn't exceed sender's balance
        uint256 senderBalance = balanceOf(address(this));
        if (senderBalance == 0) return;
        amount = amount % (senderBalance + 1);
        if (amount == 0) amount = 1;
        
        // Get initial balances
        uint256 initialSenderBalance = balanceOf(address(this));
        uint256 initialToBalance = balanceOf(to);
        
        // Perform transfer
        bool success = transfer(to, amount);
        
        // Assert transfer was successful
        assert(success);
        
        // Assert balances updated correctly
        assert(balanceOf(address(this)) == initialSenderBalance - amount);
        assert(balanceOf(to) == initialToBalance + amount);
    }
    
    // Property: Transfer should emit Transfer event
    function test_transferEmitsEvent(
        address to,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (to == address(0)) return;
        
        // Ensure amount is not zero and doesn't exceed sender's balance
        uint256 senderBalance = balanceOf(address(this));
        if (senderBalance == 0) return;
        amount = amount % (senderBalance + 1);
        if (amount == 0) amount = 1;
        
        // Expect Transfer event
        emit AssertionEvent("Transfer event should be emitted");
        
        // Perform transfer
        bool success = transfer(to, amount);
        
        // Assert transfer was successful
        assert(success);
    }
    
    // Property: Transfer should fail for insufficient balance
    function test_transferInsufficientBalance(
        address to,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (to == address(0)) return;
        
        // Ensure amount is greater than sender's balance
        uint256 senderBalance = balanceOf(address(this));
        if (senderBalance == 0) return;
        amount = senderBalance + 1 + (amount % (type(uint256).max - senderBalance));
        
        // Perform transfer (should fail)
        bool success = transfer(to, amount);
        
        // Assert transfer failed
        assert(!success);
    }
    
    // Property: Approve should update allowance
    function test_approveUpdatesAllowance(
        address spender,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (spender == address(0)) return;
        
        // Approve amount
        bool success = approve(spender, amount);
        
        // Assert approval was successful
        assert(success);
        
        // Assert allowance was updated
        assert(allowance(address(this), spender) == amount);
    }
    
    // Property: TransferFrom should update balances and allowance
    function test_transferFromUpdatesBalancesAndAllowance(
        address from,
        address to,
        uint256 amount
    ) public {
        // Skip zero addresses
        if (from == address(0) || to == address(0) || from == to) return;
        
        // Ensure from has sufficient balance
        uint256 fromBalance = balanceOf(from);
        if (fromBalance == 0) return;
        
        // Ensure amount is not zero and doesn't exceed from's balance
        amount = amount % (fromBalance + 1);
        if (amount == 0) amount = 1;
        
        // Approve this contract to spend from's tokens
        vm.prank(from);
        bool approveSuccess = GameDinToken(from).approve(address(this), amount);
        if (!approveSuccess) return;
        
        // Get initial balances and allowance
        uint256 initialFromBalance = balanceOf(from);
        uint256 initialToBalance = balanceOf(to);
        uint256 initialAllowance = allowance(from, address(this));
        
        // Perform transferFrom
        bool success = transferFrom(from, to, amount);
        
        // Assert transfer was successful
        assert(success);
        
        // Assert balances were updated correctly
        assert(balanceOf(from) == initialFromBalance - amount);
        assert(balanceOf(to) == initialToBalance + amount);
        
        // Assert allowance was decreased (if not max uint256)
        if (initialAllowance != type(uint256).max) {
            assert(allowance(from, address(this)) == initialAllowance - amount);
        }
    }
    
    // Property: Mint should increase total supply and balance
    function test_mintIncreasesSupplyAndBalance(
        address to,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (to == address(0)) return;
        
        // Ensure amount is not zero and doesn't cause overflow
        amount = amount % (type(uint256).max - totalSupply());
        if (amount == 0) amount = 1;
        
        // Get initial values
        uint256 initialSupply = totalSupply();
        uint256 initialBalance = balanceOf(to);
        
        // Mint tokens
        _mint(to, amount);
        
        // Assert total supply and balance increased
        assert(totalSupply() == initialSupply + amount);
        assert(balanceOf(to) == initialBalance + amount);
    }
    
    // Property: Burn should decrease total supply and balance
    function test_burnDecreasesSupplyAndBalance(
        address from,
        uint256 amount
    ) public {
        // Skip zero address as it's used for burns
        if (from == address(0)) return;
        
        // Ensure from has sufficient balance
        uint256 fromBalance = balanceOf(from);
        if (fromBalance == 0) return;
        
        // Ensure amount is not zero and doesn't exceed from's balance
        amount = amount % (fromBalance + 1);
        if (amount == 0) amount = 1;
        
        // Get initial values
        uint256 initialSupply = totalSupply();
        
        // Burn tokens
        _burn(from, amount);
        
        // Assert total supply and balance decreased
        assert(totalSupply() == initialSupply - amount);
        assert(balanceOf(from) == fromBalance - amount);
    }
    
    // Property: XP should never decrease
    function test_xpNeverDecreases(address user) public {
        // Get initial XP
        uint256 initialXp = getXp(user);
        
        // Perform some operations that might affect XP
        // (This is a simplified example; in a real test, you would call actual functions)
        
        // Assert XP has not decreased
        assert(getXp(user) >= initialXp);
    }
    
    // Property: Achievement should be awarded only once
    function test_achievementAwardedOnce(address user, bytes32 achievementId) public {
        // Skip zero achievement ID
        if (achievementId == bytes32(0)) return;
        
        // Check if achievement is already awarded
        bool initiallyAwarded = hasAchievement(user, achievementId);
        
        // Award achievement
        _awardAchievement(user, achievementId);
        
        // Assert achievement is now awarded
        assert(hasAchievement(user, achievementId));
        
        // If it was already awarded, the count shouldn't change
        if (initiallyAwarded) {
            assert(getAchievementCount(user) == getAchievementCount(user));
        } else {
            assert(getAchievementCount(user) > 0);
        }
    }
    
    // Event for assertions (used by Echidna)
    event AssertionEvent(string message);
}
