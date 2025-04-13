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
      "args": ["/path/to/notion-markdown-mcp/dist/index.js"],
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

## 推奨プロンプト

```txt
こちらを0123456abcのデータベースに Notion用に変換してその変換したデータを用いてNotionにPOSTして。  
Notionにポストするときparentで指定するidはpage_idではなくdatabase_idを用いて。  
タイトルは参照しているファイル名を入れて。
Notion に変換する際はヌケモレがないようにして。
```
このプロンプトには以下の目的があります：
1. 変換されたデータがNotionに送信される過程で自動的に変更されることを防ぎます
2. Notion APIの仕様に合わせて適切なIDを指定するよう促します
3. 本MCPではファイル名を自動取得できないため、タイトルとしてファイル名を使用するよう明示的に指示しています
4. マークダウンの全要素が正確に変換されるよう指示しています

## 免責事項

このMCPはNotionへのPOSTを必ず成功させることを保証するものではありません。Notion APIの仕様変更や制限により、変換されたデータが正しく投稿されない場合があります。

