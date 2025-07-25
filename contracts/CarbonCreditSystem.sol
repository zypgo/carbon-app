// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CarbonCreditNFT.sol";

/**
 * @title CarbonCreditSystem
 * @dev 碳信用交易系统主合约
 * 管理碳排放记录、碳信用项目创建、交易等核心功能
 */
contract CarbonCreditSystem is AccessControl, ReentrancyGuard {
    // NFT合约实例
    CarbonCreditNFT public immutable carbonCreditNFT;
    
    // 角色定义
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    
    // 计数器
    uint256 private _emissionIdCounter;
    uint256 private _projectIdCounter;
    uint256 private _listingIdCounter;
    
    // 排放记录结构
    struct EmissionRecord {
        uint256 id;
        address user;
        uint256 amount; // CO2排放量(kg)
        string activity; // 活动类型
        uint256 timestamp;
        bool verified; // 是否已验证
        address verifier; // 验证者地址
    }
    
    // 项目状态枚举
    enum ProjectStatus {
        Pending,    // 待审核
        Approved,   // 已批准
        Rejected    // 已拒绝
    }
    
    // 碳信用项目结构
    struct CarbonProject {
        uint256 id;
        address provider;
        string name;
        string description;
        string projectType; // 项目类型：森林、可再生能源等
        uint256 totalCredits; // 总信用额度
        uint256 availableCredits; // 可用信用
        uint256 pricePerCredit; // 每信用价格(wei)
        ProjectStatus status; // 项目状态
        address verifier; // 验证者
        uint256 createdAt;
        string documentHash; // IPFS文档哈希
        string reviewNotes; // 审核备注
    }
    
    // 碳信用上架信息
    struct CreditListing {
        uint256 id;
        uint256 projectId;
        address seller;
        uint256 amount;
        uint256 pricePerCredit;
        bool active;
        uint256 createdAt;
    }
    
    // 交易记录
    struct Transaction {
        uint256 id;
        address buyer;
        address seller;
        uint256 projectId;
        uint256 amount;
        uint256 totalPrice;
        uint256 timestamp;
    }
    
    // 存储映射
    mapping(uint256 => EmissionRecord) public emissions;
    mapping(address => uint256[]) public userEmissions;
    mapping(uint256 => CarbonProject) public projects;
    mapping(uint256 => CreditListing) public listings;
    mapping(address => mapping(uint256 => uint256)) public userCredits; // user => projectId => amount
    mapping(uint256 => Transaction) public transactions;
    
    // 数组存储所有ID
    uint256[] public allEmissionIds;
    uint256[] public allProjectIds;
    uint256[] public allListingIds;
    uint256[] public allTransactionIds;
    
    // 事件定义
    event EmissionRecorded(uint256 indexed id, address indexed user, uint256 amount, string activity);
    event EmissionVerified(uint256 indexed id, address indexed verifier);
    event ProjectCreated(uint256 indexed id, address indexed provider, string name, uint256 totalCredits);
    event ProjectVerified(uint256 indexed id, address indexed verifier);
    event ProjectRejected(uint256 indexed id, address indexed verifier, string reason);
    event CreditsGenerated(uint256 indexed projectId, uint256 amount);
    event CreditsListed(uint256 indexed listingId, uint256 indexed projectId, address indexed seller, uint256 amount, uint256 price);
    event CreditsPurchased(uint256 indexed transactionId, address indexed buyer, address indexed seller, uint256 projectId, uint256 amount, uint256 totalPrice);
    event ListingCancelled(uint256 indexed listingId);
    event CreditIssued(uint256 indexed projectId, address indexed provider, uint256 amount);
    
    constructor(address _carbonCreditNFT) {
        require(_carbonCreditNFT != address(0), "Invalid NFT contract address");
        carbonCreditNFT = CarbonCreditNFT(_carbonCreditNFT);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(PROVIDER_ROLE, msg.sender);
    }
    
    /**
     * @dev 记录碳排放数据
     * @param amount 排放量(kg CO2)
     * @param activity 活动类型
     */
    function recordEmission(uint256 amount, string memory activity) external {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(activity).length > 0, "Activity cannot be empty");
        
        _emissionIdCounter++;
        uint256 newId = _emissionIdCounter;
        
        emissions[newId] = EmissionRecord({
            id: newId,
            user: msg.sender,
            amount: amount,
            activity: activity,
            timestamp: block.timestamp,
            verified: false,
            verifier: address(0)
        });
        
        userEmissions[msg.sender].push(newId);
        allEmissionIds.push(newId);
        
        emit EmissionRecorded(newId, msg.sender, amount, activity);
    }
    
    /**
     * @dev 验证排放记录（仅验证者）
     * @param emissionId 排放记录ID
     */
    function verifyEmission(uint256 emissionId) external onlyRole(VERIFIER_ROLE) {
        require(emissions[emissionId].id != 0, "Emission record not found");
        require(!emissions[emissionId].verified, "Already verified");
        
        emissions[emissionId].verified = true;
        emissions[emissionId].verifier = msg.sender;
        
        emit EmissionVerified(emissionId, msg.sender);
    }
    
    /**
     * @dev 创建碳信用项目
     * @param name 项目名称
     * @param description 项目描述
     * @param projectType 项目类型
     * @param totalCredits 总信用额度
     * @param documentHash IPFS文档哈希
     */
    function createProject(
        string memory name,
        string memory description,
        string memory projectType,
        uint256 totalCredits,
        string memory documentHash
    ) external onlyRole(PROVIDER_ROLE) {
        // --- 新增的防护代码 ---
        require(bytes(name).length > 0 && bytes(name).length < 100, "Project name invalid length");
        require(bytes(description).length > 0 && bytes(description).length < 500, "Description invalid length");
        require(bytes(projectType).length > 0 && bytes(projectType).length < 50, "Project type invalid length");
        require(bytes(documentHash).length > 0 && bytes(documentHash).length < 100, "Document hash invalid length");
        require(totalCredits > 0 && totalCredits <= 1000000, "Total credits out of range");
        // --- 防护代码结束 ---
        
        require(totalCredits > 0, "Total credits must be greater than 0");
        
        _projectIdCounter++;
        uint256 newId = _projectIdCounter;
        
        projects[newId] = CarbonProject({
            id: newId,
            provider: msg.sender,
            name: name,
            description: description,
            projectType: projectType,
            totalCredits: totalCredits,
            availableCredits: 0, // 初始为0，验证后生成
            pricePerCredit: 0,
            status: ProjectStatus.Pending,
            verifier: address(0),
            createdAt: block.timestamp,
            documentHash: documentHash,
            reviewNotes: ""
        });
        
        allProjectIds.push(newId);
        
        emit ProjectCreated(newId, msg.sender, name, totalCredits);
    }
    
    /**
     * @dev 验证项目并生成碳信用（仅验证者）
     * @param projectId 项目ID
     */
    function verifyProject(uint256 projectId) external onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].id != 0, "Project not found");
        require(projects[projectId].status == ProjectStatus.Pending, "Project not pending");
        
        projects[projectId].status = ProjectStatus.Approved;
        projects[projectId].verifier = msg.sender;
        projects[projectId].availableCredits = projects[projectId].totalCredits;
        
        // 将信用分配给项目提供者
        userCredits[projects[projectId].provider][projectId] = projects[projectId].totalCredits;
        
        emit ProjectVerified(projectId, msg.sender);
        emit CreditsGenerated(projectId, projects[projectId].totalCredits);
    }
    
    /**
     * @dev 拒绝项目（仅验证者）
     * @param projectId 项目ID
     * @param reason 拒绝原因
     */
    function rejectProject(uint256 projectId, string memory reason) external onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].id != 0, "Project not found");
        require(projects[projectId].status == ProjectStatus.Pending, "Project not pending");
        
        projects[projectId].status = ProjectStatus.Rejected;
        projects[projectId].verifier = msg.sender;
        projects[projectId].reviewNotes = reason;
        
        emit ProjectRejected(projectId, msg.sender, reason);
    }
    
    /**
     * @dev 为验证的项目铸造碳信用NFT
     * @param projectId 项目ID
     * @param amount 信用数量
     * @param tokenURI 代币URI
     */
    function issueCredits(
        uint256 projectId,
        uint256 amount,
        string memory tokenURI
    ) external onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].status == ProjectStatus.Approved, "Project not approved");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= projects[projectId].availableCredits, "Exceeds available credits");
        
        CarbonProject storage project = projects[projectId];
        
        // 计算到期日期（项目创建后5年）
        uint256 expiryDate = project.createdAt + (5 * 365 * 24 * 60 * 60);
        
        // 铸造NFT
        carbonCreditNFT.mintCredit(
            project.provider,
            projectId,
            amount,
            block.timestamp, // vintage
            "Carbon Offset",
            project.projectType, // methodology
            project.description, // location
            expiryDate,
            tokenURI
        );
        
        // 更新用户信用余额
        userCredits[project.provider][projectId] += amount;
        
        // 更新项目可用信用量
        project.availableCredits -= amount;
        
        emit CreditIssued(projectId, project.provider, amount);
    }
    
    /**
     * @dev 上架碳信用销售
     * @param projectId 项目ID
     * @param amount 销售数量
     * @param pricePerCredit 每信用价格
     */
    function listCredits(uint256 projectId, uint256 amount, uint256 pricePerCredit) external {
        require(projects[projectId].status == ProjectStatus.Approved, "Project not approved");
        require(userCredits[msg.sender][projectId] >= amount, "Insufficient credits");
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerCredit > 0, "Price must be greater than 0");
        
        _listingIdCounter++;
        uint256 newId = _listingIdCounter;
        
        listings[newId] = CreditListing({
            id: newId,
            projectId: projectId,
            seller: msg.sender,
            amount: amount,
            pricePerCredit: pricePerCredit,
            active: true,
            createdAt: block.timestamp
        });
        
        // 锁定用户的信用
        userCredits[msg.sender][projectId] -= amount;
        
        allListingIds.push(newId);
        
        emit CreditsListed(newId, projectId, msg.sender, amount, pricePerCredit);
    }
    
    /**
     * @dev 购买碳信用
     * @param listingId 上架ID
     * @param amount 购买数量
     */
    function buyCredits(uint256 listingId, uint256 amount) external payable nonReentrant {
        CreditListing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        
        uint256 totalPrice = amount * listing.pricePerCredit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // 更新上架信息
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }
        
        // 转移信用给买家
        userCredits[msg.sender][listing.projectId] += amount;
        
        // 支付给卖家
        payable(listing.seller).transfer(totalPrice);
        
        // 退还多余的ETH
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // 记录交易
        uint256 transactionId = allTransactionIds.length + 1;
        transactions[transactionId] = Transaction({
            id: transactionId,
            buyer: msg.sender,
            seller: listing.seller,
            projectId: listing.projectId,
            amount: amount,
            totalPrice: totalPrice,
            timestamp: block.timestamp
        });
        allTransactionIds.push(transactionId);
        
        emit CreditsPurchased(transactionId, msg.sender, listing.seller, listing.projectId, amount, totalPrice);
    }
    
    /**
     * @dev 取消上架
     * @param listingId 上架ID
     */
    function cancelListing(uint256 listingId) external {
        CreditListing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        
        // 返还锁定的信用
        userCredits[msg.sender][listing.projectId] += listing.amount;
        
        emit ListingCancelled(listingId);
    }
    
    // 查询函数
    
    /**
     * @dev 获取用户的排放记录
     * @param user 用户地址
     */
    function getUserEmissions(address user) external view returns (EmissionRecord[] memory) {
        uint256[] memory userEmissionIds = userEmissions[user];
        EmissionRecord[] memory records = new EmissionRecord[](userEmissionIds.length);
        
        for (uint256 i = 0; i < userEmissionIds.length; i++) {
            records[i] = emissions[userEmissionIds[i]];
        }
        
        return records;
    }
    
    /**
     * @dev 获取所有项目
     */
    function getAllProjects() external view returns (CarbonProject[] memory) {
        CarbonProject[] memory allProjects = new CarbonProject[](allProjectIds.length);
        
        for (uint256 i = 0; i < allProjectIds.length; i++) {
            allProjects[i] = projects[allProjectIds[i]];
        }
        
        return allProjects;
    }
    
    /**
     * @dev 获取所有活跃的上架信息
     */
    function getAllListings() external view returns (CreditListing[] memory) {
        // 先计算活跃的上架数量
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allListingIds.length; i++) {
            if (listings[allListingIds[i]].active) {
                activeCount++;
            }
        }
        
        CreditListing[] memory activeListings = new CreditListing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allListingIds.length; i++) {
            if (listings[allListingIds[i]].active) {
                activeListings[index] = listings[allListingIds[i]];
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * @dev 获取用户的碳信用余额
     * @param user 用户地址
     * @param projectId 项目ID
     */
    function getUserCredits(address user, uint256 projectId) external view returns (uint256) {
        return userCredits[user][projectId];
    }
    
    /**
     * @dev 获取用户在所有项目中的信用总数
     * @param user 用户地址
     */
    function getUserTotalCredits(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < allProjectIds.length; i++) {
            total += userCredits[user][allProjectIds[i]];
        }
        return total;
    }
    
    /**
     * @dev 获取平台统计数据
     */
    function getPlatformStats() external view returns (
        uint256 totalEmissions,
        uint256 totalProjects,
        uint256 totalTransactions,
        uint256 totalCreditsIssued
    ) {
        totalEmissions = allEmissionIds.length;
        totalProjects = allProjectIds.length;
        totalTransactions = allTransactionIds.length;
        
        for (uint256 i = 0; i < allProjectIds.length; i++) {
            if (projects[allProjectIds[i]].status == ProjectStatus.Approved) {
                totalCreditsIssued += projects[allProjectIds[i]].totalCredits;
            }
        }
    }
    
    // 管理员函数
    
    /**
     * @dev 添加验证者角色
     * @param account 账户地址
     */
    function addVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, account);
    }
    
    /**
     * @dev 移除验证者角色
     * @param account 账户地址
     */
    function removeVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, account);
    }
    
    /**
     * @dev 添加提供商角色
     * @param account 账户地址
     */
    function addProvider(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PROVIDER_ROLE, account);
    }
    
    /**
     * @dev 移除提供商角色
     * @param account 账户地址
     */
    function removeProvider(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PROVIDER_ROLE, account);
    }
}