//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FUSDT
/// @author Daehwan cho
/// @notice FUSDT is pegging to USDT, wrapping USDT.

contract FUSDT is ERC20Burnable, ReentrancyGuard {
    
    /// Immutable
    IERC20 public immutable USDT;

    /// Events
    event WrapUSDT(address indexed user, uint256 _amount);
    event UnWrapUSDT(address indexed user, uint256 _amount);

    /// Error
    error InsufficientWrappedBalance();

    /// Variable
    mapping(address => uint256) public wrappedBalanceOf;

    constructor(IERC20 _usdt) ERC20("Fortune USDT", "FUSDT") {
        USDT = _usdt;
    }

    /// @return decimals of FUSDT as same as USDT
    function decimals() public view override returns (uint8) {
        return 6;
    }

    /// @param _amount of USDT to be wrapped for FUSDT
    function wrapUSDT(uint256 _amount) external nonReentrant() {
        USDT.transferFrom(msg.sender, address(this), _amount);
        _mint(msg.sender, _amount);
        emit WrapUSDT(msg.sender, _amount);
    } 

    /// @param _amount of FUSDT to be unwrapped for USDT
    function unWrapUSDT(uint256 _amount) external nonReentrant() {
        burn(_amount);
        USDT.transfer(msg.sender, _amount);
        emit UnWrapUSDT(msg.sender, _amount);
    } 
}