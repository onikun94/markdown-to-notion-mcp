#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from 'dotenv';
import { registerTools } from './tools.js';

// 環境変数を読み込む
dotenv.config();

// MCPサーバーを初期化
const server = new McpServer({
  name: "notion-markdown-mcp",
  version: "0.2.0",
});

// ツールを登録
registerTools(server);

// メイン関数
async function main() {
  try {
    // 標準入出力を使用してMCPサーバーを実行
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Notion Markdown MCP server started.');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
}); 
