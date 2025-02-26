// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function symbol() external view returns (string memory);
    function totalSupply() external view returns (uint256);
    function name() external view returns (string memory);
}

contract MusicICO {
    address public immutable owner;
    address public tokenAddress;
    uint256 public tokenSalePrice;
    uint256 public soldTokens;
    
    uint256 private constant DECIMAL_MULTIPLIER = 1e18;
    
    error OnlyOwner();
    error InsufficientEther();
    error InsufficientTokens();
    error TransferFailed();
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    function updateToken(address _tokenAddress) external onlyOwner {
        tokenAddress = _tokenAddress;
    }
    
    function updateTokenSalePrice(uint256 _tokenSalePrice) external onlyOwner {
        tokenSalePrice = _tokenSalePrice;
    }
    
    function multiply(uint256 x, uint256 y) internal pure returns (uint256) {
        if (y == 0) return 0;
        uint256 z = x * y;
        if (z / y != x) revert();
        return z;
    }

    function buyToken(uint256 _tokenAmount) external payable {
        if (msg.value != multiply(_tokenAmount, tokenSalePrice)) 
            revert InsufficientEther();
        
        ERC20 token = ERC20(tokenAddress);
        if (_tokenAmount > token.balanceOf(address(this))) 
            revert InsufficientTokens();
        
        // Using unchecked for gas optimization since we already validated the amount
        unchecked {
            soldTokens += _tokenAmount;
        }
        
        // Transfer tokens to buyer
        if (!token.transfer(msg.sender, _tokenAmount * DECIMAL_MULTIPLIER))
            revert TransferFailed();
        
        // Transfer Ether to owner
        (bool success, ) = owner.call{value: msg.value}("");
        if (!success) revert TransferFailed();
    }

    function tokenReward(uint256 _tokenAmount) external {
        ERC20 token = ERC20(tokenAddress);
        if (_tokenAmount > token.balanceOf(address(this))) 
            revert InsufficientTokens();
        
        // Using unchecked for gas optimization since we already validated the amount
        unchecked {
            soldTokens += _tokenAmount;
        }
        
        if (!token.transfer(msg.sender, _tokenAmount * DECIMAL_MULTIPLIER))
            revert TransferFailed();
    }
    
    function getTokenDetails() external view returns (
        string memory name,
        string memory symbol,
        uint256 balance,
        uint256 supply,
        uint256 tokenPrice,
        address tokenAddr
    ) {
        ERC20 token = ERC20(tokenAddress);
        return (
            token.name(),
            token.symbol(),
            token.balanceOf(address(this)),
            token.totalSupply(),
            tokenSalePrice,
            tokenAddress
        );
    }

    function transferToOwner(uint256 _amount) external payable {
        if (msg.value < _amount) revert InsufficientEther();
        
        (bool success, ) = owner.call{value: _amount}("");
        if (!success) revert TransferFailed();
    }

    function transferEther(address payable _receiver, uint256 _amount) external payable {
        if (msg.value < _amount) revert InsufficientEther();
        
        (bool success, ) = _receiver.call{value: _amount}("");
        if (!success) revert TransferFailed();
    }
}