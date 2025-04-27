module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-dnd|dnd-core|@react-dnd)/'
  ],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.(ts|tsx)'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/*.d.ts',
    '!src/serviceWorker.ts',
    '!src/setupTests.ts',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
}
