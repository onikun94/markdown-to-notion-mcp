# Notion Markdown MCP

ObsidianのマークダウンをNotion APIと互換性のある形式に変換するModel Context Protocol (MCP) サーバーです。

## 機能

- ObsidianのマークダウンテキストをNotion APIと互換性のある形式に変換
- Notion APIのpost_page用のペイロードを生成
- マークダウン要素（見出し、段落、リスト、コードブロック、引用など）をNotionブロック形式に変換

## 使用方法

### インストール

```bash
cd notion-markdown-mcp
pnpm install
pnpm run build
```

### Cursor MCPとして設定

`~/.cursor/mcp.json` ファイルに以下を追加します：

```json
{
  "mcpServers": {
    "notionMarkdown": {
      "command": "node",
      "args": ["/path/to/notion-markdown-mcp/build/index.js"],
      "env": {}
    }
  }
}
```

### 提供されるツール

#### prepare_for_notion_post

マークダウンテキストを変換して、Notion APIのpost_pageに送信できる形式に整形します。


## サポートされているマークダウン要素

- 見出し (h1-h3) ※h4以下の見出しはh3に変換されます
- 段落
- リスト（順序付き・順序なし）
- コードブロック
- 引用
- 水平線
- テーブル

## サンプルコード

```javascript
// マークダウンテキストをNotionに投稿
const markdown = `# タイトル

これは段落です。

- リストアイテム1
- リストアイテム2
`;

const notionPayload = await mcp_notionMarkdown_prepare_for_notion_post({
  markdown,
  pageParentId: "親ページのID",
  properties: {
    "タグ": {
      type: "multi_select",
      value: ["メモ", "アイデア"]
    }
  }
});

// Notion APIで投稿
await mcp_notionApi_API_post_page(notionPayload);
``` 