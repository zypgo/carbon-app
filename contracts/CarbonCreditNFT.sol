// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CarbonCreditNFT
 * @dev 碳信用NFT合约，每个碳信用作为独特的NFT代币
 * 支持碳信用的铸造、转移、销毁等功能
 */
contract CarbonCreditNFT is ERC721, ERC721URIStorage, AccessControl {
    // 角色定义
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // 代币ID计数器
    uint256 private _tokenIdCounter;
    
    // 碳信用元数据结构
    struct CreditMetadata {
        uint256 projectId; // 关联的项目ID
        uint256 amount; // 信用数量(kg CO2)
        uint256 vintage; // 年份
        string projectType; // 项目类型：森林、可再生能源等
        string methodology; // 方法学
        string region; // 地区
        uint256 issuanceDate; // 发行日期
        uint256 expiryDate; // 到期日期
        bool retired; // 是否已退役（使用）
        uint256 retiredDate; // 退役日期
        address retiredBy; // 退役者
        string retirementReason; // 退役原因
    }
    
    // 存储映射
    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(uint256 => uint256[]) public projectTokens; // projectId => tokenIds
    mapping(address => uint256[]) public userTokens; // user => tokenIds
    
    // 统计数据
    uint256 public totalSupply;
    uint256 public totalRetired;
    
    // 事件定义
    event CreditMinted(uint256 indexed tokenId, address indexed to, uint256 indexed projectId, uint256 amount);
    event CreditRetired(uint256 indexed tokenId, address indexed retiredBy, string reason);
    event CreditTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    
    constructor() ERC721("Carbon Credit NFT", "CCN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    /**
     * @dev 为项目铸造碳信用NFT
     * @param to 接收者地址
     * @param projectId 项目ID
     * @param amount 信用数量
     * @param vintage 年份
     * @param projectType 项目类型
     * @param methodology 方法学
     * @param region 地区
     * @param expiryDate 到期日期
     * @param _tokenURI 代币URI
     */
    function mintCredit(
        address to,
        uint256 projectId,
        uint256 amount,
        uint256 vintage,
        string memory projectType,
        string memory methodology,
        string memory region,
        uint256 expiryDate,
        string memory _tokenURI
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // 铸造NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // 设置元数据
        creditMetadata[tokenId] = CreditMetadata({
            projectId: projectId,
            amount: amount,
            vintage: vintage,
            projectType: projectType,
            methodology: methodology,
            region: region,
            issuanceDate: block.timestamp,
            expiryDate: expiryDate,
            retired: false,
            retiredDate: 0,
            retiredBy: address(0),
            retirementReason: ""
        });
        
        // 更新索引
        projectTokens[projectId].push(tokenId);
        userTokens[to].push(tokenId);
        totalSupply++;
        
        emit CreditMinted(tokenId, to, projectId, amount);
    }
    
    /**
     * @dev 退役（销毁）碳信用
     * @param tokenId 代币ID
     * @param reason 退役原因
     */
    function retireCredit(uint256 tokenId, string memory reason) external {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not owner or approved");
        require(!creditMetadata[tokenId].retired, "Credit already retired");
        require(bytes(reason).length > 0, "Retirement reason required");
        
        // 更新元数据
        creditMetadata[tokenId].retired = true;
        creditMetadata[tokenId].retiredDate = block.timestamp;
        creditMetadata[tokenId].retiredBy = msg.sender;
        creditMetadata[tokenId].retirementReason = reason;
        
        totalRetired++;
        
        // 销毁NFT
        _burn(tokenId);
        
        emit CreditRetired(tokenId, msg.sender, reason);
    }
    
    /**
     * @dev 批量退役碳信用
     * @param tokenIds 代币ID数组
     * @param reason 退役原因
     */
    function retireCredits(uint256[] memory tokenIds, string memory reason) external {
        require(tokenIds.length > 0, "No tokens provided");
        require(bytes(reason).length > 0, "Retirement reason required");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_isAuthorized(ownerOf(tokenIds[i]), msg.sender, tokenIds[i]), "Not owner or approved");
            require(!creditMetadata[tokenIds[i]].retired, "Credit already retired");
            
            // 更新元数据
            creditMetadata[tokenIds[i]].retired = true;
            creditMetadata[tokenIds[i]].retiredDate = block.timestamp;
            creditMetadata[tokenIds[i]].retiredBy = msg.sender;
            creditMetadata[tokenIds[i]].retirementReason = reason;
            
            totalRetired++;
            
            // 销毁NFT
            _burn(tokenIds[i]);
            
            emit CreditRetired(tokenIds[i], msg.sender, reason);
        }
    }
    
    /**
     * @dev 转移代币时更新用户索引
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        address previousOwner = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0)) {
            // 从发送者的代币列表中移除
            _removeTokenFromUser(from, tokenId);
            // 添加到接收者的代币列表
            userTokens[to].push(tokenId);
            
            emit CreditTransferred(tokenId, from, to);
        }
        
        return previousOwner;
    }
    
    /**
     * @dev 从用户代币列表中移除指定代币
     */
    function _removeTokenFromUser(address user, uint256 tokenId) private {
        uint256[] storage tokens = userTokens[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
    
    // 查询函数
    
    /**
     * @dev 获取碳信用元数据
     * @param tokenId 代币ID
     */
    function getCreditMetadata(uint256 tokenId) external view returns (CreditMetadata memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return creditMetadata[tokenId];
    }
    
    /**
     * @dev 获取项目的所有代币
     * @param projectId 项目ID
     */
    function getProjectTokens(uint256 projectId) external view returns (uint256[] memory) {
        return projectTokens[projectId];
    }
    
    /**
     * @dev 获取用户的所有代币
     * @param user 用户地址
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }
    
    /**
     * @dev 获取用户的活跃代币（未退役）
     * @param user 用户地址
     */
    function getUserActiveTokens(address user) external view returns (uint256[] memory) {
        uint256[] memory allTokens = userTokens[user];
        uint256 activeCount = 0;
        
        // 计算活跃代币数量
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (!creditMetadata[allTokens[i]].retired) {
                activeCount++;
            }
        }
        
        // 构建活跃代币数组
        uint256[] memory activeTokens = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (!creditMetadata[allTokens[i]].retired) {
                activeTokens[index] = allTokens[i];
                index++;
            }
        }
        
        return activeTokens;
    }
    
    /**
     * @dev 获取用户的碳信用总量
     * @param user 用户地址
     */
    function getUserTotalCredits(address user) external view returns (uint256) {
        uint256[] memory tokens = userTokens[user];
        uint256 total = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (!creditMetadata[tokens[i]].retired) {
                total += creditMetadata[tokens[i]].amount;
            }
        }
        
        return total;
    }
    
    /**
     * @dev 获取项目的碳信用总量
     * @param projectId 项目ID
     */
    function getProjectTotalCredits(uint256 projectId) external view returns (uint256) {
        uint256[] memory tokens = projectTokens[projectId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            total += creditMetadata[tokens[i]].amount;
        }
        
        return total;
    }
    
    /**
     * @dev 获取项目的活跃碳信用总量
     * @param projectId 项目ID
     */
    function getProjectActiveCredits(uint256 projectId) external view returns (uint256) {
        uint256[] memory tokens = projectTokens[projectId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (!creditMetadata[tokens[i]].retired) {
                total += creditMetadata[tokens[i]].amount;
            }
        }
        
        return total;
    }
    
    /**
     * @dev 检查代币是否过期
     * @param tokenId 代币ID
     */
    function isExpired(uint256 tokenId) external view returns (bool) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return block.timestamp > creditMetadata[tokenId].expiryDate;
    }
    
    /**
     * @dev 获取平台统计数据
     */
    function getStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalRetired,
        uint256 _totalActive,
        uint256 _totalAmount,
        uint256 _totalRetiredAmount
    ) {
        _totalSupply = totalSupply;
        _totalRetired = totalRetired;
        _totalActive = totalSupply - totalRetired;
        
        // 计算总信用量和已退役信用量
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (_ownerOf(i) != address(0)) {
                _totalAmount += creditMetadata[i].amount;
                if (creditMetadata[i].retired) {
                    _totalRetiredAmount += creditMetadata[i].amount;
                }
            }
        }
    }
    
    // 管理员函数
    
    /**
     * @dev 添加铸造者角色
     * @param account 账户地址
     */
    function addMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev 移除铸造者角色
     * @param account 账户地址
     */
    function removeMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev 添加销毁者角色
     * @param account 账户地址
     */
    function addBurner(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BURNER_ROLE, account);
    }
    
    /**
     * @dev 移除销毁者角色
     * @param account 账户地址
     */
    function removeBurner(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(BURNER_ROLE, account);
    }
    
    // 重写必要的函数
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}