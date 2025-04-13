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
  convertToNotionBlocks: vi.fn().mockImplementation((tokens: any[]) => {
    // テストのために、渡されたトークンの数に対応する数のパラグラフブロックを返す
    return tokens.map((token: any, index: number) => ({
      type: 'paragraph',
      paragraph: { 
        rich_text: [{ text: { content: `テスト${index}` } }] 
      }
    }));
  })
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
  
  it('ツールが正しく登録される', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // 1つのツールが登録されたことを確認
    expect(mockTool).toHaveBeenCalledTimes(1);
    
    // ツールの名前と説明をチェック
    expect(mockTool).toHaveBeenCalledWith(
      'prepare_for_notion_post',
      'マークダウンテキストを変換して、Notion APIのpost_pageに送信できる形式に整形する',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('prepare_for_notion_postツールが正しく動作する', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // ツールのコールバック関数を取得
    const toolCallback = mockTool.mock.calls[0][3];
    
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
    
    // タイトルが正しく設定されていることを確認
    expect(parsed.properties).toHaveProperty('title');
    expect(parsed.properties.title).toHaveProperty('title');
    expect(parsed.properties.title.title).toBe('テストタイトル');
  });
  
  it('prepare_for_notion_postツールが5000字程度の長い文章を正しく処理できる', () => {
    // ツールを登録
    registerTools(mockMcpServer as any);
    
    // ツールのコールバック関数を取得
    const toolCallback = mockTool.mock.calls[0][3];
    
    // 5000字程度の長い文章を生成
    const longText = '# テスト長文タイトル\n\n' + ''.padStart(5000, 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん').match(/.{1,80}/g)?.join('\n\n');
    
    // フロントマターを含む長いマークダウンとデータベースID
    const markdown = `---\ntitle: 長文テスト\n---\n\n${longText}`;
    const pageParentId = 'db_12345';
    
    // ツールを実行
    const result = toolCallback({ markdown, pageParentId });
    
    // 結果にcontentプロパティがあることを確認
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    
    // 変換されたJSONを解析
    const jsonStr = result.content[0].text as string;
    const parsed = JSON.parse(jsonStr);
    
    // 期待される構造を持っていることを確認
    expect(parsed).toHaveProperty('parent');
    expect(parsed).toHaveProperty('properties');
    expect(parsed).toHaveProperty('children');
    
    // 親データベースIDが正しく設定されていることを確認
    expect(parsed.parent.database_id).toBe(pageParentId);
    
    // タイトルが正しく設定されていることを確認
    expect(parsed.properties).toHaveProperty('title');
    expect(parsed.properties.title).toHaveProperty('title');
    expect(parsed.properties.title.title).toBe('長文テスト');
    
    // 子ブロックが生成されていることを確認
    expect(Array.isArray(parsed.children)).toBe(true);
    expect(parsed.children.length).toBeGreaterThan(0);
    
    // 長文が正しく処理されたことを確認（ブロック数が多い）
    expect(parsed.children.length).toBeGreaterThan(10);
  });
}); 