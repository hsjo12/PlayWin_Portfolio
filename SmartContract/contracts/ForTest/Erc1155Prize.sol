//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract Erc1155Prize is ERC1155, Ownable {
    
    mapping(uint256 => string) uris;

    constructor(address _owner) ERC1155("") Ownable(_owner)
    {
        _mint(msg.sender, 1, 1, "");
        uris[1] = "https://ipfs.io/ipfs/QmUxE4C3MoacLgpZkoSUEYwx1K25szdswXzAd957Xkdm3e";
    }

    function mint(address to, uint256 id, uint256 value) external onlyOwner {
        _mint(to, id, value, "");
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return uris[_id];
    }

    function setUri(uint256 _id, string calldata _uri) external onlyOwner {
        uris[_id] = _uri;
    }
}