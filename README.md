# Owlbear Rodeo Vision Switch（测试版）

仅 GM 可操作。勾选已启用 Smoke & Spectre! 视野的玩家 Character Token，点击“关灯”将 `com.battle-system.smoke/visionRange` 临时设为 0；保留 `visionDark`。点击“开灯”恢复之前保存的值。备份保存在 Token 元数据 `wow.vision-switch/originalRange`。

## 部署（GitHub Pages）
1. 在 GitHub 新建 **Public** 仓库（如 `obr-vision-switch`）。
2. 将此目录**内部的所有文件**上传到仓库根目录（包括 `.github/workflows/deploy.yml` 隐藏目录），提交到 `main` 分支。建议通过 GitHub Desktop 或 Git 命令上传，避免网页上传漏掉 `.github`。
3. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
4. Actions 中等待 `Deploy Owlbear extension` 成功。
5. 打开部署页面，找到站点网址。假设网址为 `https://用户名.github.io/obr-vision-switch/`，则 Owlbear 扩展 manifest 地址为 `https://用户名.github.io/obr-vision-switch/manifest.json`。
6. Owlbear Rodeo 房间中打开 Extensions → Add Extension（或 Install Extension），粘贴 manifest URL 安装。
7. GM 打开“视野开关”，先在**测试场景**勾选一个角色，点击关灯/开灯，并在玩家视角验证。

## 本地开发
`npm install` → `npm run dev`。在 Owlbear 中安装本地开发服务的 `/manifest.json`，开发服务须可通过 HTTPS 访问（可用 HTTPS 隧道）。

## 注意
- 本版**未在真实 Owlbear 房间实测**，首次请只用测试 Token。
- 为避免误改怪物，默认不勾选任何角色；只显示 Character 图层且 `hasVision=true` 的 Token。
- 开灯只恢复本扩展关过灯的 Token，不会修改其他 Token。
- 如关灯期间手动修改了普通视野，开灯会恢复最初保存值；应先开灯再修改原始视野。
- 若移除扩展前仍处于关灯状态，请先开灯恢复数值。
- 这不是环境光照计算器，不处理固定光源。
