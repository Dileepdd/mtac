export const interpolate = (template: string, data: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in data)) throw new Error(`Missing template variable: {{${key}}}`);
    return data[key];
  });
