import { marked } from 'marked';
import matter from 'gray-matter';

// マークダウントークンをNotion APIのブロック形式に変換する関数
export function convertToNotionBlocks(tokens: any[]): any[] {
  const blocks: any[] = [];
  
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        // Notionは heading_1, heading_2, heading_3 のみサポート
        // heading_4 以上は heading_3 として扱う
        const headingDepth = Math.min(token.depth, 3);
        
        blocks.push({
          object: "block",
          type: `heading_${headingDepth}`,
          [`heading_${headingDepth}`]: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: token.text
                }
              }
            ],
            color: "default"
          }
        });
        break;
        
      case 'paragraph':
        // パラグラフ内のインラインコードを処理
        if (token.tokens && token.tokens.some((t: any) => t.type === 'codespan')) {
          const richTextArray = [];
          
          let i = 0;
          while (i < token.tokens.length) {
            const inlineToken = token.tokens[i];
            
            if (inlineToken.type === 'codespan') {
              // インラインコードの場合、スペースとバッククォートで囲む
              richTextArray.push({
                type: "text",
                text: {
                  content: ` \`${inlineToken.text}\`` 
                }
              });
            } else if (inlineToken.type === 'text') {
              richTextArray.push({
                type: "text",
                text: {
                  content: inlineToken.text
                }
              });
            }
            
            i++;
          }
          
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: richTextArray,
              color: "default"
            }
          });
        } else {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: token.text
                  }
                }
              ],
              color: "default"
            }
          });
        }
        break;
        
      case 'list':
        const listType = token.ordered ? "numbered_list_item" : "bulleted_list_item";
        for (const item of token.items) {
          blocks.push({
            object: "block",
            type: listType,
            [listType]: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: item.text
                  }
                }
              ],
              color: "default"
            }
          });
        }
        break;
        
      case 'code':
        // コードブロックのサイズチェックと分割処理
        const codeContent = token.text;
        const MAX_CODE_LENGTH = 2000;
        
        if (codeContent.length <= MAX_CODE_LENGTH) {
          // 2000文字以下の場合は通常処理
          blocks.push({
            object: "block",
            type: "code",
            code: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: codeContent
                  }
                }
              ],
              language: token.lang || "plain text"
            }
          });
        } else {
          // 2000文字を超える場合は分割処理
          for (let i = 0; i < codeContent.length; i += MAX_CODE_LENGTH) {
            const partContent = codeContent.substring(i, i + MAX_CODE_LENGTH);
            const partNumber = Math.floor(i / MAX_CODE_LENGTH) + 1;
            const totalParts = Math.ceil(codeContent.length / MAX_CODE_LENGTH);
            
            blocks.push({
              object: "block",
              type: "code",
              code: {
                rich_text: [
                  {
                    type: "text",
                    text: {
                      content: partContent
                    }
                  }
                ],
                language: token.lang || "plain text",
                caption: [
                  {
                    type: "text",
                    text: {
                      content: `Part ${partNumber}/${totalParts}`
                    }
                  }
                ]
              }
            });
            
            // 分割されたブロック間に区切り線を追加（オプション）
            if (partNumber < totalParts) {
              blocks.push({
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [
                    {
                      type: "text",
                      text: {
                        content: `▼ コードの続き ▼`
                      }
                    }
                  ],
                  color: "default"
                }
              });
            }
          }
        }
        break;
        
      case 'blockquote':
        blocks.push({
          object: "block",
          type: "quote",
          quote: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: token.text
                }
              }
            ],
            color: "default"
          }
        });
        break;
        
      case 'hr':
        blocks.push({
          object: "block",
          type: "divider",
          divider: {}
        });
        break;
        
      case 'table':
        // テーブルの処理（簡略化）
        const tableRows = [];
        if (token.header) {
          tableRows.push({
            type: "table_row",
            table_row: {
              cells: token.header.map((cell: string) => [{ type: "text", text: { content: cell } }])
            }
          });
        }
        
        for (const row of token.rows) {
          tableRows.push({
            type: "table_row",
            table_row: {
              cells: row.map((cell: string) => [{ type: "text", text: { content: cell } }])
            }
          });
        }
        
        blocks.push({
          object: "block",
          type: "table",
          table: {
            table_width: token.header ? token.header.length : (token.rows[0] ? token.rows[0].length : 1),
            has_column_header: !!token.header,
            has_row_header: false,
            children: tableRows
          }
        });
        break;
    }
  }
  
  return blocks;
} 