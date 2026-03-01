const config = require('../../src/config');

describe('Configuration', () => {
  it('loads configuration successfully', () => {
    expect(config).toBeDefined();
    expect(config.env).toBe('test');
  });

  it('has server configuration', () => {
    expect(config.server).toBeDefined();
    expect(config.server.port).toBeDefined();
    expect(config.server.host).toBeDefined();
  });

  it('has API configuration', () => {
    expect(config.api).toBeDefined();
    expect(config.api.openrouter).toBeDefined();
    // API key comes from env - just verify it exists as a string
    expect(typeof config.api.openrouter.apiKey).toBe('string');
    expect(config.api.openrouter.baseUrl).toContain('openrouter.ai');
  });

  it('has workspace configuration', () => {
    expect(config.workspace).toBeDefined();
    expect(config.workspace.root).toBeDefined();
  });

  it('has reset function for tests', () => {
    expect(typeof config.reset).toBe('function');
  });
});
