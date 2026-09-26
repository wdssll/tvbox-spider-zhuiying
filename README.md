# TVBox / FongMi QuickJS Spiders

适用于 TVBox / 影视TV (FongMi) 的 QuickJS ES Module 爬虫（`type: 3`），聚合与解析多个优质影视站点。

---

## 包含站点源

| 源 Key | 名称 | 目标站点 | 爬虫脚本 | 特点 |
| :--- | :--- | :--- | :--- | :--- |
| `zhuiying` | **追影影视** | [zhuiying3.cc](https://zhuiying3.cc) | `gaze.js` | 防盗链 MD5 验签与 Base64 解密，直接提取极速直连 m3u8 |
| `nivod` | **泥视频** | [www.nivod.cc](https://www.nivod.cc) | `nivod.js` | 官方 PC 站直出源，多线路免密直解极速 m3u8，秒开零等待 |
| `aidianying` | **爱电影** | [kuhh4jo.com](https://kuhh4jo.com) | `aidianying.js` | SHA1(MD5()) 双重验签直连 RESTful API，腾讯云 EdgeOne 蓝光/超清直链免密秒开 |
| `xueluo` | **雪落影视** | [v.xl01.cc.ua](https://v.xl01.cc.ua) | `xueluo.js` | 内置纯 JS AES-128-ECB 动态验签，提取 4GB+ 1080P/4K 高清 MP4/CDN 原画直链 |
| `jinpai` | **金牌影院** | [vv3nwjk.com](https://vv3nwjk.com) | `jinpai.js` | 蓝光原画专线，SHA1(MD5()) 签名直链输出 1080P/720P 多码率 m3u8 |

---

## 特性

- **纯原生 QuickJS ES 模块**：同步执行设计，零外部 npm 依赖，完美兼容 Android TVBox / FongMi 影视TV。
- **全生命周期钩子支持**：`init`, `home`, `homeVod`, `category`, `detail`, `play`, `search` 及各种 TVBox 兼容别名。
- **多维度筛选与分页**：电影、电视剧/剧集、动漫、综艺、短剧等完整分类与无限滚动分页。
- **智能播放流分流**：直链源（泥视频、爱电影、追影自建 CDN）直接走 `parse: 0`；官方 VIP 线路自动标记 `parse: 1` 联动聚合解析。

---

## 使用方法

### 方式 1：直接在 TVBox 中配置多源订阅地址

在 TVBox / 影视TV 的配置地址中填入以下任意一个地址：

#### GitHub Raw 地址：
```text
https://raw.githubusercontent.com/wdssll/tvbox-spider-zhuiying/main/config.json
```

#### jsDelivr CDN 加速地址（国内访问推荐）：
```text
https://cdn.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/config.json
```
*(若遇到 CDN 缓存未及时更新，可在链接末尾加上版本号强制刷新，例如 `.../config.json?v=5`)*

---

### 如何在 TVBox 中切换站点源与刷新配置

1. **刷新配置（清除本地缓存）**：
   - 进入 TVBox **【设置】** -> 点击 **【配置地址】** -> 无需修改直接点击 **【确定】**，强制 TVBox 重新向服务器拉取最新配置。
2. **切换站点源**：
   - TVBox 首页默认只显示单个站点的影视流（默认排在第一个的「追影影视」）。
   - 在 TVBox 首页上方点击站点名称（当前显示的 **【追影影视】** 或 **【首页】** 按钮），即可弹出 **【换源 / 站点选择】** 列表，在列表中选中 **【泥视频】** 或 **【爱电影】** 即可切换。
   - 也可以在 **【设置】** -> **【首页数据源】/【默认主页】** 中直接选择对应站点。

---

### 方式 2：合并到现有多源订阅配置

可将所需站点直接加入到现有 TVBox 配置 JSON 的 `"sites"` 列表中：

```json
{
  "sites": [
    {
      "key": "zhuiying",
      "name": "追影影视",
      "type": 3,
      "api": "https://cdn.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/gaze.js",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 1,
      "categories": [
        "电影",
        "电视剧",
        "动漫",
        "综艺",
        "短剧"
      ],
      "ext": "https://zhuiying3.cc"
    },
    {
      "key": "nivod",
      "name": "泥视频",
      "type": 3,
      "api": "https://cdn.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/nivod.js",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 0,
      "categories": [
        "电影",
        "电视剧",
        "综艺",
        "动漫"
      ],
      "ext": "https://www.nivod.cc"
    },
    {
      "key": "aidianying",
      "name": "爱电影",
      "type": 3,
      "api": "https://cdn.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/aidianying.js",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 0,
      "categories": [
        "电影",
        "电视剧",
        "综艺",
        "动漫",
        "短剧"
      ],
      "ext": "https://kuhh4jo.com"
    }
  ]
}
```

---

## 文件结构

- `gaze.js`：追影影视 QuickJS 爬虫脚本。
- `nivod.js`：泥视频 QuickJS 爬虫脚本。
- `aidianying.js`：爱电影 QuickJS 爬虫脚本。
- `xueluo.js`：雪落影视 QuickJS 爬虫脚本。
- `jinpai.js`：金牌影院 QuickJS 爬虫脚本。
- `youtube_live.txt`：YouTube 24/7 高清直播频道聚合列表。
- `config.json`：多源配置文件（包含默认聚合解析器）。
- `server.mjs`：本地局域网测试服务。
