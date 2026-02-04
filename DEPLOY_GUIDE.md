# 部署指南 (方案二：公网云部署)

本指南将指导你如何将年会网站部署到互联网，以便任何网络环境下的用户都能访问。
我们将架构分为三个部分：
1. **数据库**：MongoDB Atlas (免费云数据库)
2. **后端 API**：Railway (支持 WebSocket 的托管服务)
3. **前端页面**：Vercel (全球最快的静态网站托管)

---

## 第一步：准备数据库 (MongoDB Atlas)

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) 并注册账号。
2. 创建一个新的 **Cluster** (选择 **Shared / Free** 免费版)。
3. 在 **Security** -> **Network Access** 中，点击 **Add IP Address**，选择 **Allow Access from Anywhere** (0.0.0.0/0)，确认。
4. 在 **Security** -> **Database Access** 中，创建一个数据库用户 (记住用户名和密码)。
5. 点击 **Database** -> **Connect** -> **Drivers**。
6. 复制连接字符串，它看起来像这样：
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
7. 将 `<username>` 和 `<password>` 替换为你刚才设置的账号密码。
   > **记下这个链接，我们在第二步要用。**

---

## 第二步：部署后端 (Railway)

由于游戏使用了 WebSocket (手机摇一摇实时通信)，我们需要一个支持长连接的服务。

1. 注册并登录 [Railway](https://railway.app/) (可用 GitHub 登录)。
2. 点击 **New Project** -> **Deploy from GitHub repo**。
3. 选择你的代码仓库 `annual-party-website`。
4. 点击刚创建的项目，进入 **Settings** -> **Variables**。
5. 添加以下环境变量：
   - `MONGODB_URI`: (填入第一步获得的数据库连接字符串)
   - `PORT`: `3001`
6. Railway 会自动识别 `package.json` 并开始构建。等待部署完成 (Status 变为 Active)。
7. 在 **Settings** -> **Networking** 中，点击 **Generate Domain** 生成一个公网域名 (例如 `web-production-xxxx.up.railway.app`)。
   > **记下这个域名，我们在第三步要用。**

---

## 第三步：部署前端 (Vercel)

1. 注册并登录 [Vercel](https://vercel.com/)。
2. 点击 **Add New ...** -> **Project** -> **Import** 你的 GitHub 仓库。
3. 在 **Configure Project** 页面，找到 **Environment Variables** (环境变量) 区域。
4. 添加以下变量 (将域名替换为你在第二步获得的 Railway 域名)：
   - `VITE_API_URL`: `https://web-production-xxxx.up.railway.app/api`
   - `VITE_SOCKET_URL`: `https://web-production-xxxx.up.railway.app`
   *(注意：URL 开头是 https://，结尾不要带斜杠)*
5. 点击 **Deploy**。
6. 等待几十秒，部署完成后，Vercel 会给你一个访问链接 (例如 `annual-party-website.vercel.app`)。

---

## 完成！🎉

现在，你可以把 Vercel 生成的链接发给所有人，无论他们在哪里，使用 4G/5G 还是 Wi-Fi，都可以直接访问并扫码参加游戏了！

### 常见问题
- **如果后端连不上？**
  检查 Railway 的日志 (Logs)，确认 MongoDB 是否连接成功。
- **如果手机扫码后不动？**
  检查前端 Vercel 的环境变量 `VITE_SOCKET_URL` 是否填写正确，必须与 Railway 的域名一致。
