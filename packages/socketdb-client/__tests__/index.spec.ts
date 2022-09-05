import * as client from '..';

it('should be true', async () => {
  expect(true).toBe(true);
});

const db = new client.SocketDatabase(null as any, 'aaa');
