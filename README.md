# TVBox / FongMi QuickJS Spiders

适用于 TVBox / 影视TV (FongMi) 的 QuickJS ES Module 爬虫（`type: 3`），聚合与解析多个优质影视站点。

---

## 包含站点源

| 源 Key | 名称 | 目标站点 | 爬虫脚本 | 特点 |
| :--- | :--- | :--- | :--- | :--- |
| `zhuiying` | **追影影视** | [zhuiying3.cc](https://zhuiying3.cc) | `gaze.js` | 防盗链 MD5 验签与 Base64 解密，直接提取极速直连 m3u8 |
| `pianku` | **片库影视** | [4k01.pianku.online](https://4k01.pianku.online) | `pianku.js` | 4K60 帧极速源直连播放，官方源自动切换 VIP 解析，支持子分类筛选 |

---

## 特性

- **纯原生 QuickJS ES 模块**：同步执行设计，零外部 npm 依赖，完美兼容 Android TVBox / FongMi 影视TV。
- **全生命周期钩子支持**：`init`, `home`, `homeVod`, `category`, `detail`, `play`, `search` 及各种 TVBox 兼容别名。
- **多维度筛选**：支持按类型、剧情子分类、地区、年份、排序等实时过滤。
- **智能播放线路分流**：直链源（如自营 4K60 帧、自建 CDN）直接走 `parse: 0`；官方 VIP 线路（腾讯、优酷、爱奇艺、芒果）自动标记 `parse: 1` 联动聚合解析。

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
https://fastly.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/config.json
```

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
      "api": "https://fastly.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/gaze.js",
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
      "key": "pianku",
      "name": "片库影视",
      "type": 3,
      "api": "https://fastly.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/pianku.js",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 1,
      "categories": [
        "电影",
        "剧集",
        "动漫",
        "综艺"
      ],
      "ext": "https://4k01.pianku.online"
    }
  ]
}
```

---

## 文件结构

- `gaze.js`：追影影视 QuickJS 爬虫脚本。
- `pianku.js`：片库影视 QuickJS 爬虫脚本。
- `config.json`：多源配置文件（包含默认聚合解析器）。
- `server.mjs`：本地局域网测试服务。
