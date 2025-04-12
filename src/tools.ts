import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { marked } from 'marked';
import matter from 'gray-matter';
import { convertToNotionBlocks } from './converters.js';
import { buildPropertyObject } from './utils.js';

// MCPサーバーにツールを登録する関数
export function registerTools(server: McpServer): void {
  // マークダウンテキストを更新してNotion post_pageに送信するツール
  server.tool(
    "prepare_for_notion_post",
    "マークダウンテキストを変換して、Notion APIのpost_pageに送信できる形式に整形する",
    { 
      markdown: z.string().describe("変換するマークダウンテキスト"),
      pageParentId: z.string().describe("親ページのID"),
      properties: z.record(z.object({
        type: z.string(),
        value: z.any()
      })).optional().describe("ページのプロパティ (例: {\"title\": {\"type\": \"title\", \"value\": \"タイトル\"}})")
    },
    ({ markdown, pageParentId, properties = {} }) => {
      // フロントマターを解析
      const { data: frontMatter, content } = matter(markdown);
      
      // マークダウンのパース
      const tokens = marked.lexer(content);
      
      // Notionのブロック形式に変換
      const notionBlocks = convertToNotionBlocks(tokens);
      
      // 最初の見出しや段落をタイトルとして使用
      let title = "無題のページ";
      // フロントマターにタイトルがあればそれを使用
      if (frontMatter && frontMatter.title) {
        title = frontMatter.title;
      } else {
        // フロントマターになければコンテンツから探す
        for (const token of tokens) {
          if ((token as any).type === 'heading' || (token as any).type === 'paragraph') {
            title = (token as any).text;
            break;
          }
        }
      }
      
      // プロパティオブジェクトの構築
      const notionProperties: Record<string, any> = {};
      
      // フロントマターのプロパティは無視し、タイトルのみ設定
      notionProperties["title"] = buildPropertyObject("title", "title", { "title": title });
      
      // ユーザー指定のプロパティがある場合のみ追加（オプション）
      for (const [key, propertyObj] of Object.entries(properties)) {
        if (typeof propertyObj !== 'object' || propertyObj === null) continue;
        
        const type = (propertyObj as any).type;
        const value = (propertyObj as any).value;
        
        if (!type || value === undefined) continue;
        
        notionProperties[key] = buildPropertyObject(key, type, { [key]: value });
      }
      
      // Notion APIのpost_page用のペイロード形式
      const postPayload = {
        parent: {
          database_id: pageParentId
        },
        properties: notionProperties,
        children: notionBlocks
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(postPayload, null, 2)
          }
        ]
      };
    }
  );
} 