// jest setup file

// mock expo module to avoid import issues
jest.mock('expo', () => ({}));

// suppress console.log in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
