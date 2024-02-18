//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract Erc721Prize is ERC721, Ownable {
    
    uint256 constant MAX_SUPPLY = 7777; // 1 ~ 7777

    error  OutOfNFT();

    using Strings for uint256;

    uint256 public id;

    constructor(
        string memory _name, 
        string memory _symbol,
        address _owner
    ) 
        ERC721(_name, _symbol) 
        Ownable(_owner)
    {
        _safeMint(msg.sender, ++id); /// 1000 USDT
    }

    function mint(address _receiver) external onlyOwner {
        if(++id > MAX_SUPPLY) revert OutOfNFT();
        _safeMint(_receiver, id);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = "https://api.lilheroes.io/latest/metadata/nft/";
        return bytes(baseURI).length > 0 ? string.concat(baseURI, tokenId.toString()) : "";
    }
}