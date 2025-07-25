const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Carbon Credit System", function () {
  let carbonCreditSystem;
  let carbonCreditNFT;
  let owner;
  let company1;
  let company2;
  let trader1;
  let trader2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, company1, company2, trader1, trader2] = await ethers.getSigners();

    // 部署 NFT 合约
    const CarbonCreditNFT = await ethers.getContractFactory("CarbonCreditNFT");
    carbonCreditNFT = await CarbonCreditNFT.deploy();
    await carbonCreditNFT.waitForDeployment();

    // 部署系统合约
    const CarbonCreditSystem = await ethers.getContractFactory("CarbonCreditSystem");
    carbonCreditSystem = await CarbonCreditSystem.deploy(await carbonCreditNFT.getAddress());
    await carbonCreditSystem.waitForDeployment();

    // 设置 NFT 合约的 minter 权限
    await carbonCreditNFT.addMinter(await carbonCreditSystem.getAddress());
  });

  describe("排放记录", function () {
    it("应该能够记录排放数据", async function () {
      const emissionAmount = ethers.parseUnits("100", 18);
      
      await carbonCreditSystem.connect(company1).recordEmission(
        emissionAmount,
        "工厂生产排放"
      );

      const records = await carbonCreditSystem.getUserEmissions(company1.address);
      expect(records.length).to.equal(1);
      expect(records[0].amount).to.equal(emissionAmount);
      expect(records[0].activity).to.equal("工厂生产排放");
    });

    it("应该能够验证排放记录", async function () {
      const emissionAmount = ethers.parseUnits("100", 18);
      
      await carbonCreditSystem.connect(company1).recordEmission(
        emissionAmount,
        "工厂生产排放"
      );

      const records = await carbonCreditSystem.getUserEmissions(company1.address);
      const emissionId = records[0].id;

      await carbonCreditSystem.connect(owner).verifyEmission(emissionId);
      
      const updatedRecord = await carbonCreditSystem.emissions(emissionId);
      expect(updatedRecord.verified).to.be.true;
      expect(updatedRecord.verifier).to.equal(owner.address);
    });
  });

  describe("项目创建", function () {
    it("应该能够创建碳信用项目", async function () {
      // 首先给company1授予PROVIDER_ROLE
      await carbonCreditSystem.connect(owner).grantRole(
        await carbonCreditSystem.PROVIDER_ROLE(),
        company1.address
      );
      
      await carbonCreditSystem.connect(company1).createProject(
        "森林种植项目",
        "通过种植1000棵树减少碳排放",
        "森林碳汇",
        ethers.parseUnits("1000", 18),
        "QmTestHash123"
      );

      const projects = await carbonCreditSystem.getAllProjects();
      expect(projects.length).to.equal(1);
      expect(projects[0].name).to.equal("森林种植项目");
      expect(projects[0].provider).to.equal(company1.address);
      expect(projects[0].verified).to.be.false;
    });

    it("应该能够验证项目", async function () {
      // 授予角色并创建项目
      await carbonCreditSystem.connect(owner).grantRole(
        await carbonCreditSystem.PROVIDER_ROLE(),
        company1.address
      );
      
      await carbonCreditSystem.connect(company1).createProject(
        "森林种植项目",
        "通过种植1000棵树减少碳排放",
        "森林碳汇",
        ethers.parseUnits("1000", 18),
        "QmTestHash123"
      );

      const projects = await carbonCreditSystem.getAllProjects();
      const projectId = projects[0].id;

      // 验证项目
      await carbonCreditSystem.connect(owner).verifyProject(projectId);
      
      const updatedProject = await carbonCreditSystem.projects(projectId);
      expect(updatedProject.verified).to.be.true;
      expect(updatedProject.verifier).to.equal(owner.address);
    });
  });

  describe("碳信用发行", function () {
    let projectId;
    
    beforeEach(async function () {
      // 授予角色并创建项目
      await carbonCreditSystem.connect(owner).grantRole(
        await carbonCreditSystem.PROVIDER_ROLE(),
        company1.address
      );
      
      await carbonCreditSystem.connect(company1).createProject(
        "森林种植项目",
        "通过种植1000棵树减少碳排放",
        "森林碳汇",
        ethers.parseUnits("1000", 18),
        "QmTestHash123"
      );

      const projects = await carbonCreditSystem.getAllProjects();
      projectId = projects[0].id;
      
      // 验证项目
      await carbonCreditSystem.connect(owner).verifyProject(projectId);
    });

    it("应该能够发行碳信用NFT", async function () {
      const creditAmount = ethers.parseUnits("100", 18);
      
      await carbonCreditSystem.connect(owner).issueCredits(
        projectId,
        creditAmount,
        "https://example.com/metadata/1"
      );

      const balance = await carbonCreditNFT.balanceOf(company1.address);
      expect(balance).to.equal(1);
    });
  });

  describe("碳信用交易", function () {
    let projectId;
    const creditAmount = ethers.parseUnits("100", 18);
    const pricePerCredit = ethers.parseEther("0.001");

    beforeEach(async function () {
      // 授予角色并创建验证项目
      await carbonCreditSystem.connect(owner).grantRole(
        await carbonCreditSystem.PROVIDER_ROLE(),
        company1.address
      );
      
      await carbonCreditSystem.connect(company1).createProject(
        "森林种植项目",
        "通过种植1000棵树减少碳排放",
        "森林碳汇",
        ethers.parseUnits("1000", 18),
        "QmTestHash123"
      );

      const projects = await carbonCreditSystem.getAllProjects();
      projectId = projects[0].id;
      
      await carbonCreditSystem.connect(owner).verifyProject(projectId);
      
      // 发行碳信用NFT
      await carbonCreditSystem.connect(owner).issueCredits(
        projectId,
        creditAmount,
        "https://example.com/metadata/1"
      );
    });

    it("应该能够上架碳信用", async function () {
      await carbonCreditSystem.connect(company1).listCredits(
        projectId,
        creditAmount,
        pricePerCredit
      );

      const listings = await carbonCreditSystem.getAllListings();
      expect(listings.length).to.equal(1);
      expect(listings[0].seller).to.equal(company1.address);
      expect(listings[0].pricePerCredit).to.equal(pricePerCredit);
      expect(listings[0].amount).to.equal(creditAmount);
    });

    it("应该能够购买碳信用", async function () {
        const listAmount = 50; // 简化为整数
        const buyAmount = 10;
        const price = ethers.parseEther("0.001"); // 0.001 ETH per credit
        
        // 检查company1当前的信用余额
        const initialCredits = await carbonCreditSystem.userCredits(company1.address, projectId);
        expect(initialCredits).to.be.gt(0);
        
        await carbonCreditSystem.connect(company1).listCredits(
          projectId,
          listAmount,
          price
        );

        const listings = await carbonCreditSystem.getAllListings();
        const listingId = listings[0].id;

        // 买家购买信用
        await carbonCreditSystem.connect(trader1).buyCredits(listingId, buyAmount, {
          value: ethers.parseEther("1") // 发送足够的ETH
        });

        // 检查买家的信用余额
        const buyerCredits = await carbonCreditSystem.userCredits(trader1.address, projectId);
        expect(buyerCredits).to.equal(buyAmount);
      });
  });

  describe("数据查询", function () {
    beforeEach(async function () {
      // 记录排放数据
      await carbonCreditSystem.connect(company1).recordEmission(
        ethers.parseUnits("100", 18),
        "工厂生产排放"
      );

      await carbonCreditSystem.connect(company2).recordEmission(
        ethers.parseUnits("200", 18),
        "运输排放"
      );

      // 创建项目
      await carbonCreditSystem.connect(owner).grantRole(
        await carbonCreditSystem.PROVIDER_ROLE(),
        company1.address
      );
      
      await carbonCreditSystem.connect(company1).createProject(
        "森林种植项目",
        "通过种植1000棵树减少碳排放",
        "森林碳汇",
        ethers.parseUnits("1000", 18),
        "QmTestHash123"
      );
    });

    it("应该能够获取用户排放记录", async function () {
      const emissions = await carbonCreditSystem.getUserEmissions(company1.address);
      expect(emissions.length).to.equal(1);
      expect(emissions[0].amount).to.equal(ethers.parseUnits("100", 18));
      expect(emissions[0].activity).to.equal("工厂生产排放");
    });

    it("应该能够获取所有项目", async function () {
      const projects = await carbonCreditSystem.getAllProjects();
      expect(projects.length).to.equal(1);
      expect(projects[0].name).to.equal("森林种植项目");
      expect(projects[0].provider).to.equal(company1.address);
    });

    it("应该能够获取活跃的上架信息", async function () {
      const listings = await carbonCreditSystem.getAllListings();
      expect(listings.length).to.equal(0); // 初始没有上架
    });
  });
});