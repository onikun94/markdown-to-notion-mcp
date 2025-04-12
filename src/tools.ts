import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { marked } from 'marked';
import matter from 'gray-matter';
import { convertToNotionBlocks } from './converters.js';
import { buildPropertyObject } from './utils.js';

// MCPサーバーにツールを登録する関数
export function registerTools(server: McpServer): void {
  // Obsidianマークダウンをノーション互換形式に変換するツール
  server.tool(
    "convert_markdown_to_notion",
    "ObsidianのマークダウンをNotion APIと互換性のある形式に変換する",
    { 
      markdown: z.string().describe("変換するマークダウンテキスト"),
      titleProperty: z.string().optional().describe("タイトルとして使用するプロパティ名")
    },
    ({ markdown, titleProperty = "title" }) => {
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
      
      // フロントマターのプロパティを追加
      const properties = {
        [titleProperty]: title,
        ...frontMatter
      };
      
      const result = {
        title,
        blocks: notionBlocks,
        properties
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

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
      // フロントマターのプロパティを変換
      for (const [key, value] of Object.entries(frontMatter)) {
        // nullの場合はスキップ
        if (value === null) continue;
        
        // IDプロパティの場合はスキップ
        if (key.toLowerCase() === 'id') continue;
        
        // プロパティタイプを推測（簡易的な実装）
        let propertyType = typeof value === 'string' ? 'rich_text' : 
                          typeof value === 'number' ? 'number' :
                          typeof value === 'boolean' ? 'checkbox' :
                          Array.isArray(value) ? 'multi_select' : 'rich_text';
                          
        // タイトルの場合は特別扱い
        if (key === 'title') propertyType = 'title';
        
        // tagsの場合は特別扱い - 常にmulti_selectとして処理
        if (key.toLowerCase() === 'tags') {
          propertyType = 'multi_select';
          // 文字列の場合はカンマまたはスペース区切りで配列に変換
          if (typeof value === 'string') {
            const tagArray = value.includes(',') 
              ? value.split(',').map(tag => tag.trim())
              : value.split(/\s+/);
            notionProperties[key] = buildPropertyObject(key, propertyType, { [key]: tagArray });
            continue;
          }
        }
        
        notionProperties[key] = buildPropertyObject(key, propertyType, { [key]: value });
      }
      
      // ユーザー指定のプロパティを追加（優先）
      for (const [key, prop] of Object.entries(properties)) {
        // nullの場合はスキップ
        if ((prop as any).value === null) continue;
        
        // IDプロパティの場合はスキップ
        if (key.toLowerCase() === 'id') continue;
        
        // tagsプロパティの場合は特別処理
        if (key.toLowerCase() === 'tags' && (prop as any).type === 'multi_select') {
          // multi_selectの形式を正規化する
          const value = (prop as any).value;
          if (Array.isArray(value)) {
            const normalizedTags = value.map(tag => {
              // タグが{name:{name:"タグ名"}}の形式の場合、{name:"タグ名"}に変換
              if (tag && typeof tag === 'object' && tag.name && typeof tag.name === 'object' && tag.name.name) {
                return {name: tag.name.name};
              }
              // タグが{name:"タグ名"}の形式ならそのまま
              else if (tag && typeof tag === 'object' && tag.name && typeof tag.name === 'string') {
                return tag;
              }
              // その他の場合は標準形式に変換
              return {name: tag};
            });
            notionProperties[key] = {
              multi_select: normalizedTags
            };
          } else {
            notionProperties[key] = buildPropertyObject(key, (prop as any).type, { [key]: (prop as any).value });
          }
        } else {
          notionProperties[key] = buildPropertyObject(key, (prop as any).type, { [key]: (prop as any).value });
        }
      }
      
      // タイトルプロパティがなければ追加
      if (!notionProperties.title) {
        notionProperties.title = buildPropertyObject("title", "title", { title });
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