import { describe, it, expect } from 'vitest';
import { buildPropertyObject } from '../utils.js';

describe('buildPropertyObject', () => {
  it('titleプロパティを正しく構築する', () => {
    const result = buildPropertyObject('title', 'title', { title: 'テストタイトル' });
    
    expect(result).toEqual({
      title: [
        {
          text: {
            content: 'テストタイトル',
          },
        },
      ],
    });
  });

  it('rich_textプロパティを正しく構築する', () => {
    const result = buildPropertyObject('description', 'rich_text', { description: 'テスト説明文' });
    
    expect(result).toEqual({
      rich_text: [
        {
          text: {
            content: 'テスト説明文',
          },
        },
      ],
    });
  });

  it('非文字列をJSON文字列に変換してrich_textプロパティを構築する', () => {
    const obj = { key: 'value' };
    const result = buildPropertyObject('data', 'rich_text', { data: obj });
    
    expect(result).toEqual({
      rich_text: [
        {
          text: {
            content: JSON.stringify(obj),
          },
        },
      ],
    });
  });

  it('dateプロパティを正しく構築する', () => {
    const dateStr = '2023-01-01';
    const result = buildPropertyObject('date', 'date', { date: dateStr });
    
    expect(result).toEqual({
      date: {
        start: dateStr,
      },
    });
  });

  it('日付オブジェクトからdateプロパティを正しく構築する', () => {
    const dateObj = { start: '2023-01-01', end: '2023-01-31' };
    const result = buildPropertyObject('date', 'date', { date: dateObj });
    
    expect(result).toEqual({
      date: {
        start: '2023-01-01',
      },
    });
  });

  it('numberプロパティを正しく構築する', () => {
    const result = buildPropertyObject('count', 'number', { count: 42 });
    
    expect(result).toEqual({
      number: 42,
    });
  });

  it('文字列からnumberプロパティを構築する', () => {
    const result = buildPropertyObject('count', 'number', { count: '42' });
    
    expect(result).toEqual({
      number: 42,
    });
  });

  it('checkboxプロパティを正しく構築する', () => {
    const result = buildPropertyObject('done', 'checkbox', { done: true });
    
    expect(result).toEqual({
      checkbox: true,
    });
  });

  it('selectプロパティを正しく構築する', () => {
    const result = buildPropertyObject('status', 'select', { status: 'Done' });
    
    expect(result).toEqual({
      select: {
        name: 'Done',
      },
    });
  });

  it('オブジェクトからselectプロパティを構築する', () => {
    const result = buildPropertyObject('status', 'select', { status: { name: 'Done', id: '123' } });
    
    expect(result).toEqual({
      select: {
        name: 'Done',
      },
    });
  });

  it('multi_selectプロパティを文字列配列から正しく構築する', () => {
    const result = buildPropertyObject('tags', 'multi_select', { tags: ['タグ1', 'タグ2'] });
    
    expect(result).toEqual({
      multi_select: [
        { name: 'タグ1' },
        { name: 'タグ2' },
      ],
    });
  });

  it('multi_selectプロパティを単一文字列から正しく構築する', () => {
    const result = buildPropertyObject('tags', 'multi_select', { tags: 'シングルタグ' });
    
    expect(result).toEqual({
      multi_select: [
        { name: 'シングルタグ' },
      ],
    });
  });

  it('multi_selectプロパティをオブジェクト配列から正しく構築する', () => {
    const result = buildPropertyObject('tags', 'multi_select', { 
      tags: [
        { name: 'タグ1' },
        { name: { name: 'ネストタグ' } },
        { other: 'フィールド' }
      ] 
    });
    
    expect(result).toEqual({
      multi_select: [
        { name: 'タグ1' },
        { name: 'ネストタグ' },
        { name: '[object Object]' }
      ],
    });
  });

  it('filesプロパティを文字列から正しく構築する', () => {
    const result = buildPropertyObject('attachment', 'files', { attachment: 'https://example.com/file.pdf' });
    
    expect(result).toEqual({
      files: [
        {
          name: 'https://example.com/file.pdf',
          type: 'external',
          external: {
            url: 'https://example.com/file.pdf',
          },
        },
      ],
    });
  });

  it('filesプロパティを配列から正しく構築する', () => {
    const result = buildPropertyObject('attachments', 'files', { 
      attachments: [
        'https://example.com/file1.pdf',
        'https://example.com/file2.pdf'
      ] 
    });
    
    expect(result).toEqual({
      files: [
        {
          name: 'https://example.com/file1.pdf',
          type: 'external',
          external: {
            url: 'https://example.com/file1.pdf',
          },
        },
        {
          name: 'https://example.com/file2.pdf',
          type: 'external',
          external: {
            url: 'https://example.com/file2.pdf',
          },
        },
      ],
    });
  });

  it('nullまたはundefined値の場合はnullを返す', () => {
    const nullResult = buildPropertyObject('test', 'rich_text', { test: null });
    const undefinedResult = buildPropertyObject('test', 'rich_text', { test: undefined });
    
    expect(nullResult).toBeNull();
    expect(undefinedResult).toBeNull();
  });

  it('カスタムタイプの場合はそのまま値を使用する', () => {
    const result = buildPropertyObject('custom', 'custom_type', { custom: { foo: 'bar' } });
    
    expect(result).toEqual({
      custom_type: { foo: 'bar' },
    });
  });
}); 