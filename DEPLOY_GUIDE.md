# 碳信用交易DApp部署指南

本指南将帮助您将碳信用交易DApp部署到GitHub Pages。

## 前提条件

- 已有GitHub账户
- 已安装Git
- 已安装Node.js和npm

## 步骤1：创建GitHub仓库

1. 登录您的GitHub账户
2. 点击右上角的"+"图标，选择"New repository"
3. 仓库名称设置为"carbon-app"
4. 描述可以填写"碳信用交易DApp"
5. 保持仓库为公开（Public）
6. 不要初始化仓库（不要添加README、.gitignore或许可证）
7. 点击"Create repository"

## 步骤2：关联本地仓库与GitHub仓库

在终端中执行以下命令：

```bash
git remote add origin https://github.com/zypgo/carbon-app.git
git branch -M main
git push -u origin main
```

## 步骤3：修改package.json中的homepage字段

编辑package.json文件，确保homepage字段正确设置：

```json
"homepage": "https://zypgo.github.io/carbon-app",
```

## 步骤4：部署到GitHub Pages

在终端中执行以下命令：

```bash
npm run deploy
```

这个命令会执行以下操作：
1. 构建应用程序（npm run build）
2. 将构建结果推送到GitHub仓库的gh-pages分支

## 步骤5：配置GitHub Pages

1. 在GitHub上打开您的仓库
2. 点击"Settings"选项卡
3. 在左侧菜单中点击"Pages"
4. 在"Source"部分，确保选择了"gh-pages"分支和"/(root)"文件夹
5. 点击"Save"

## 步骤6：访问您的网站

部署完成后，您可以通过以下URL访问您的网站：

```
https://zypgo.github.io/carbon-app/
```

部署可能需要几分钟时间才能生效。

## 更新网站

如果您对代码进行了更改并想更新网站，只需执行以下步骤：

1. 提交您的更改：
   ```bash
   git add .
   git commit -m "更新说明"
   ```

2. 推送到GitHub：
   ```bash
   git push origin main
   ```

3. 重新部署：
   ```bash
   npm run deploy
   ```

## 故障排除

如果您在部署过程中遇到问题，请检查以下几点：

1. 确保package.json中的homepage字段正确设置
2. 确保vite.config.ts中的base字段设置为'/carbon-app/'
3. 确保您有GitHub仓库的写入权限
4. 检查GitHub Pages设置是否正确配置为使用gh-pages分支 