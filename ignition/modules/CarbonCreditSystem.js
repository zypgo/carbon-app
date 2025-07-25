import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CarbonCreditSystemModule", (m) => {
  // 部署CarbonCreditNFT合约
  const carbonCreditNFT = m.contract("CarbonCreditNFT");

  // 部署CarbonCreditSystem合约，传入NFT合约地址
  const carbonCreditSystem = m.contract("CarbonCreditSystem", [carbonCreditNFT]);

  // 设置NFT合约的铸造者角色为CarbonCreditSystem合约
  m.call(carbonCreditNFT, "addMinter", [carbonCreditSystem]);

  return {
    carbonCreditNFT,
    carbonCreditSystem,
  };
});