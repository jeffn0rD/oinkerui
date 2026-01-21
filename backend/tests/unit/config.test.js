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
    expect(config.api.openrouter.apiKey).toBe('test-key');
  });

  it('has workspace configuration', () => {
    expect(config.workspace).toBeDefined();
    expect(config.workspace.root).toBeDefined();
  });
});