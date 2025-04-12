import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerTools } from '../tools.js';

// McpServerのモック
const mockTool = vi.fn();
const mockMcpServer = {
  tool: mockTool
};

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => mockMcpServer)
}));

// convertersとutilsのモック
vi.mock('../converters.js', () => ({
  convertToNotionBlocks: vi.fn().mockReturnValue([
    { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'テスト' } }] } }
  ])
}));

vi.mock('../utils.js', () => ({
  buildPropertyObject: vi.fn().mockImplementation((name, type, values) => {
    return { [type]: values[name] };
  })
}));

describe('registerTools', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    vi.clearAllMocks();
  });
  
  it('2つのツールが正しく登録される', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // 2つのツールが登録されたことを確認
    expect(mockTool).toHaveBeenCalledTimes(2);
    
    // 各ツールの名前と説明をチェック
    expect(mockTool).toHaveBeenCalledWith(
      'convert_markdown_to_notion',
      'ObsidianのマークダウンをNotion APIと互換性のある形式に変換する',
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(mockTool).toHaveBeenCalledWith(
      'prepare_for_notion_post',
      'マークダウンテキストを変換して、Notion APIのpost_pageに送信できる形式に整形する',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('convert_markdown_to_notionツールが正しく動作する', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // ツールのコールバック関数を取得
    const toolCallback = mockTool.mock.calls[0][3];
    
    // フロントマターを含むマークダウン
    const markdown = '---\ntitle: テストタイトル\n---\n\nテスト本文';
    
    // ツールを実行して結果を期待値と比較するためのテスト手法を変更
    const result = toolCallback({ markdown, titleProperty: 'title' });
    
    // 結果にcontentプロパティがあることを確認
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    
    // 変換されたJSONを解析（型エラーを避けるため修正）
    const jsonStr = result.content[0].text as string;
    const parsed = JSON.parse(jsonStr);
    
    // 期待される構造を持っていることを確認
    expect(parsed).toHaveProperty('title');
    expect(parsed).toHaveProperty('blocks');
    expect(parsed).toHaveProperty('properties');
  });
  
  it('prepare_for_notion_postツールが正しく動作する', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // ツールのコールバック関数を取得
    const toolCallback = mockTool.mock.calls[1][3];
    
    // フロントマターを含むマークダウンとデータベースID
    const markdown = '---\ntitle: テストタイトル\ntags: タグ1, タグ2\n---\n\nテスト本文';
    const pageParentId = 'db_12345';
    
    // ツールを実行
    const result = toolCallback({ markdown, pageParentId });
    
    // 結果にcontentプロパティがあることを確認
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    
    // 変換されたJSONを解析（型エラーを避けるため修正）
    const jsonStr = result.content[0].text as string;
    const parsed = JSON.parse(jsonStr);
    
    // 期待される構造を持っていることを確認
    expect(parsed).toHaveProperty('parent');
    expect(parsed).toHaveProperty('properties');
    expect(parsed).toHaveProperty('children');
    
    // 親データベースIDが正しく設定されていることを確認
    expect(parsed.parent.database_id).toBe(pageParentId);
  });
}); 