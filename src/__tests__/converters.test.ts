import { describe, it, expect } from 'vitest';
import { convertToNotionBlocks } from '../converters.js';
import { marked } from 'marked';

describe('convertToNotionBlocks', () => {
  it('インラインコードを正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン
    const markdown = 'これは`インラインコード`です。複数の`コード`が含まれる場合も`正しく変換`されます。';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('paragraph');
    
    const richText = blocks[0].paragraph.rich_text;
    
    // インラインコードのテキスト要素の数を確認
    expect(richText.length).toBe(7);
    
    // 最初のテキスト
    expect(richText[0].type).toBe('text');
    expect(richText[0].text.content).toBe('これは');
    
    // 最初のインラインコード（スペース含む）
    expect(richText[1].type).toBe('text');
    expect(richText[1].text.content).toBe(' `インラインコード`');
    
    // 中間のテキスト
    expect(richText[2].type).toBe('text');
    expect(richText[2].text.content).toBe('です。複数の');
    
    // 2つ目のインラインコード（スペース含む）
    expect(richText[3].type).toBe('text');
    expect(richText[3].text.content).toBe(' `コード`');
    
    // 3つ目のインラインコードの前のテキスト
    expect(richText[4].type).toBe('text');
    expect(richText[4].text.content).toBe('が含まれる場合も');
    
    // 3つ目のインラインコード（スペース含む）
    expect(richText[5].type).toBe('text');
    expect(richText[5].text.content).toBe(' `正しく変換`');
    
    // 最後のテキスト
    expect(richText[6].type).toBe('text');
    expect(richText[6].text.content).toBe('されます。');
    
    // インラインコードがスペース付きバッククォートで囲まれていることを確認
    richText.forEach((textObj: { text: { content: string } }) => {
      if (textObj.text.content.includes('インラインコード') || 
          textObj.text.content.includes('コード') ||
          textObj.text.content.includes('正しく変換')) {
        expect(textObj.text.content.trim().startsWith('`')).toBe(true);
        expect(textObj.text.content.endsWith('`')).toBe(true);
      }
    });
    
    // 全体文のテスト - 変換後のテキストを連結して期待する形式になっているか確認
    const fullText = richText.map((item: { text: { content: string } }) => item.text.content).join('');
    expect(fullText).toBe('これは `インラインコード`です。複数の `コード`が含まれる場合も `正しく変換`されます。');
  });
  
  it('段落内にインラインコードがない場合は通常のテキストブロックとして処理する', () => {
    // テスト対象のマークダウン
    const markdown = 'これは通常のテキストです。インラインコードは含まれていません。';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('paragraph');
    
    const richText = blocks[0].paragraph.rich_text;
    expect(richText.length).toBe(1); // 単一のテキストブロック
    
    expect(richText[0].type).toBe('text');
    expect(richText[0].text.content).toBe('これは通常のテキストです。インラインコードは含まれていません。');
  });

  it('見出しを正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン - 各レベルの見出し
    const markdown = '# 見出し1\n## 見出し2\n### 見出し3\n#### 見出し4';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(4);
    
    // 見出し1
    expect(blocks[0].type).toBe('heading_1');
    expect(blocks[0].heading_1.rich_text[0].text.content).toBe('見出し1');
    
    // 見出し2
    expect(blocks[1].type).toBe('heading_2');
    expect(blocks[1].heading_2.rich_text[0].text.content).toBe('見出し2');
    
    // 見出し3
    expect(blocks[2].type).toBe('heading_3');
    expect(blocks[2].heading_3.rich_text[0].text.content).toBe('見出し3');
    
    // 見出し4 (Notionでは heading_3 として扱われる)
    expect(blocks[3].type).toBe('heading_3');
    expect(blocks[3].heading_3.rich_text[0].text.content).toBe('見出し4');
  });

  it('リストを正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン - 順序なしリストと順序付きリスト
    const markdown = '- 項目1\n- 項目2\n\n1. 番号1\n2. 番号2';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証 - リストアイテムが4つになるはず
    expect(blocks.length).toBe(4);
    
    // 順序なしリスト（bulleted_list_item）
    expect(blocks[0].type).toBe('bulleted_list_item');
    expect(blocks[0].bulleted_list_item.rich_text[0].text.content).toBe('項目1');
    
    expect(blocks[1].type).toBe('bulleted_list_item');
    expect(blocks[1].bulleted_list_item.rich_text[0].text.content).toBe('項目2');
    
    // 順序付きリスト（numbered_list_item）
    expect(blocks[2].type).toBe('numbered_list_item');
    expect(blocks[2].numbered_list_item.rich_text[0].text.content).toBe('番号1');
    
    expect(blocks[3].type).toBe('numbered_list_item');
    expect(blocks[3].numbered_list_item.rich_text[0].text.content).toBe('番号2');
  });

  it('コードブロックを正しくNotionフォーマットに変換する（2000文字以下）', () => {
    // テスト対象のマークダウン - コードブロック
    const markdown = '```javascript\nconst hello = "world";\nconsole.log(hello);\n```';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].code.language).toBe('javascript');
    expect(blocks[0].code.rich_text[0].text.content).toBe('const hello = "world";\nconsole.log(hello);');
  });

  it('コードブロックを正しく分割する（2000文字超）', () => {
    // 2001文字のコードを生成
    const longCode = 'x'.repeat(2001);
    const markdown = '```\n' + longCode + '\n```';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証 - 2つのコードブロックと1つの区切りパラグラフになるはず
    expect(blocks.length).toBe(3);
    
    // 最初のコードブロック
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].code.rich_text[0].text.content.length).toBe(2000);
    expect(blocks[0].code.caption[0].text.content).toBe('Part 1/2');
    
    // 区切りパラグラフ
    expect(blocks[1].type).toBe('paragraph');
    expect(blocks[1].paragraph.rich_text[0].text.content).toBe('▼ コードの続き ▼');
    
    // 2つ目のコードブロック
    expect(blocks[2].type).toBe('code');
    expect(blocks[2].code.rich_text[0].text.content.length).toBe(1);
    expect(blocks[2].code.caption[0].text.content).toBe('Part 2/2');
  });

  it('引用ブロックを正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン - 引用
    const markdown = '> これは引用文です';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('quote');
    expect(blocks[0].quote.rich_text[0].text.content).toBe('これは引用文です');
  });

  it('区切り線を正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン - 区切り線
    const markdown = '---';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('divider');
    expect(blocks[0].divider).toEqual({});
  });

  it('テーブルを正しくNotionフォーマットに変換する', () => {
    // テスト対象のマークダウン - テーブル
    const markdown = '| 列1 | 列2 |\n| --- | --- |\n| セル1 | セル2 |\n| セル3 | セル4 |';
    
    // マークダウンをトークンに変換
    const tokens = marked.lexer(markdown);
    
    // Notionブロックに変換
    const blocks = convertToNotionBlocks(tokens);
    
    // 結果の検証
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('table');
    
    // テーブル構造の検証
    expect(blocks[0].table.table_width).toBe(2);
    expect(blocks[0].table.has_column_header).toBe(true);
    expect(blocks[0].table.has_row_header).toBe(false);
    
    // テーブルの行数（ヘッダー + データ行2行）
    expect(blocks[0].table.children.length).toBe(3);
    
    // ヘッダー行 - 内容を確認
    const headerCell1 = blocks[0].table.children[0].table_row.cells[0][0];
    const headerCell2 = blocks[0].table.children[0].table_row.cells[1][0];
    expect(headerCell1.text).toHaveProperty('content');
    expect(headerCell2.text).toHaveProperty('content');
    
    // データ行1 - 内容を確認
    const row1Cell1 = blocks[0].table.children[1].table_row.cells[0][0];
    const row1Cell2 = blocks[0].table.children[1].table_row.cells[1][0];
    expect(row1Cell1.text).toHaveProperty('content');
    expect(row1Cell2.text).toHaveProperty('content');
    
    // データ行2 - 内容を確認
    const row2Cell1 = blocks[0].table.children[2].table_row.cells[0][0];
    const row2Cell2 = blocks[0].table.children[2].table_row.cells[1][0];
    expect(row2Cell1.text).toHaveProperty('content');
    expect(row2Cell2.text).toHaveProperty('content');
  });
}); 