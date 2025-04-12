// ユーザーが提供したプロパティオブジェクト構築関数
export function buildPropertyObject(customName: string, customType: string, customValues: Record<string, any>) {
  const value = customValues[customName];
  
  // nullの場合はnullを返す
  if (value === null || value === undefined) {
    return null;
  }

  // 空文字列、undefined、nullでない場合の処理
  switch (customType) {
    case "title":
      return {
        title: [
          {
            text: {
              content: typeof value === 'string' ? value : String(value || ''),
            },
          },
        ],
      };
    case "rich_text":
      return {
        rich_text: [
          {
            text: {
              content: typeof value === 'string' ? value : JSON.stringify(value || ''),
            },
          },
        ],
      };
    case "date":
      // 日付形式の文字列または日付オブジェクトを処理
      let dateValue = value;
      if (value && typeof value === 'object' && value.start) {
        dateValue = value.start;
      }
      return {
        date: {
          start: dateValue || new Date().toISOString(),
        },
      };
    case "number":
      return {
        number: Number(value) || 0,
      };
    case "phone_number":
      return {
        phone_number: String(value),
      };
    case "email":
      return {
        email: String(value),
      };
    case "url":
      return {
        url: String(value),
      };
    case "files":
      return {
        files: Array.isArray(value) ? value.map(url => ({
          name: typeof url === 'string' ? url : String(url),
          type: "external",
          external: {
            url: typeof url === 'string' ? url : String(url),
          },
        })) : [
          {
            name: String(value),
            type: "external",
            external: {
              url: String(value),
            },
          },
        ],
      };
    case "checkbox":
      return {
        checkbox: Boolean(value) || false,
      };
    case "select":
      let selectName = value;
      if (value && typeof value === 'object' && value.name) {
        selectName = value.name;
      }
      return {
        select: {
          name: typeof selectName === 'string' ? selectName : String(selectName),
        },
      };
    case "multi_select":
      if (Array.isArray(value)) {
        return {
          multi_select: value.map(item => {
            if (typeof item === 'string') {
              return { name: item };
            } else if (item && typeof item === 'object') {
              if (item.name) {
                if (typeof item.name === 'string') {
                  return { name: item.name };
                } else if (item.name && typeof item.name === 'object' && item.name.name) {
                  return { name: item.name.name };
                }
              }
              return { name: String(item) };
            } else {
              return { name: String(item) };
            }
          }),
        };
      } else {
        return {
          multi_select: [{ name: typeof value === 'string' ? value : String(value) }],
        };
      }
    default:
      return { [customType]: value };
  }
} 