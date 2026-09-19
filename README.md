# TVBox / FongMi QuickJS Spider - 追影影视

适用于 TVBox / 影视TV (FongMi) 的 QuickJS ES Module 爬虫（`type: 3`），聚合与解析 [追影影视 (zhuiying3.cc)](https://zhuiying3.cc)。

---

## 特性

- **纯原生 QuickJS ES 模块**：同步运行，零外部依赖，兼容 Android TVBox / FongMi 影视TV。
- **全生命周期钩子支持**：`init`, `home`, `homeVod`, `category`, `detail`, `play`, `search` 及兼容别名。
- **全格式筛选与分类**：包含电影、电视剧、动漫、综艺、短剧，以及地区、类型、排序、年份的级联筛选。
- **自适应签名与流解析**：原生支持防盗链 MD5 签名生成、Base64 逆序解密，提取真实高清 `.m3u8` 流。

---

## 使用方法

### 方式 1：直接在 TVBox 中配置订阅地址

将 `config.json` 的 Raw 地址（或 jsDelivr CDN 地址）直接填入 TVBox 的配置地址中：

#### GitHub Raw 地址：
```text
https://raw.githubusercontent.com/wdssll/tvbox-spider-zhuiying/main/config.json
```

#### jsDelivr CDN 加速地址（国内网络访问更稳定）：
```text
https://fastly.jsdelivr.net/gh/wdssll/tvbox-spider-zhuiying@main/config.json
```

---

### 方式 2：合并到现有多源订阅配置

在现有的配置 JSON 的 `"sites"` 数组中添加本源：

```json
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
}
```

---

## 文件结构

- `gaze.js`：TVBox QuickJS 核心爬虫脚本。
- `config.json`：TVBox 单源配置接口。
- `server.mjs`：本地调试与静态服务脚本（可选）。
