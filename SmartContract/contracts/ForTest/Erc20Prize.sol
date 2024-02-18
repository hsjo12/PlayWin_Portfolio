//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract Erc20Prize is ERC20, Ownable {
    
    constructor(
        string memory _name, 
        string memory _symbol,
        address _owner
    ) 
        ERC20(_name, _symbol) 
        Ownable(_owner)
    {
        _mint(msg.sender, 1000 ether); /// 1000 USDT
    }
        function mint(address _receiver, uint256 _amount) external onlyOwner {
        _mint(_receiver, _amount);
    }
}