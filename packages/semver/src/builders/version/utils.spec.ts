import * as fs from 'fs';
import { getWorkspaceDefinition } from './utils';

describe('getWorkspaceDefinition', () => {
  let fakeReadFileSync: jest.Mock;

  beforeEach(() => {
    fakeReadFileSync = jest.fn().mockReturnValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );
    jest
      .spyOn(fs, 'readFile')
      .mockImplementation((...args: Parameters<typeof fs.readFile>) => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const callback = args[args.length - 1] as Function;
        try {
          callback(null, fakeReadFileSync(args));
        } catch (e) {
          callback(e);
        }
      });
  });

  afterEach(() =>
    (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRestore()
  );

  it('should fallback to angular.json if workspace.json is not found', async () => {
    fakeReadFileSync.mockImplementationOnce(() => {
      throw new Error('ENOENT, no such file or directory');
    });
    fakeReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );
    expect(await getWorkspaceDefinition('/root').toPromise()).toEqual(
      expect.objectContaining({
        projects: {
          a: {
            root: 'packages/a',
          },
          b: {
            root: 'packages/b',
          },
        },
      })
    );
    expect(fs.readFile).toBeCalledTimes(2);
    expect(fs.readFile).toHaveBeenNthCalledWith(
      1,
      '/root/workspace.json',
      'utf-8',
      expect.any(Function)
    );
    expect(fs.readFile).toHaveBeenNthCalledWith(
      2,
      '/root/angular.json',
      'utf-8',
      expect.any(Function)
    );
  });
});
