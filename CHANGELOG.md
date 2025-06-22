# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-22

### Added

#### Core Functionality
- **Essential Monadic Operations**: `map`, `mapAsync`, `flatMap`, `flatMapAsync`, `fold`, `bimap`, `tap`, `tapAsync`
- **Error Handling Operations**: `mapError`, `recover`, `recoverWith`, `orElse`, `getOrElse`, `getOrElseWith`, `filter`
- **Validation Support**: Error accumulation with `Validation` type, `combine`, `validateObject`, `sequence`
- **Async Utilities**: `parallel`, `race`, `sequential`, `retry`, `withTimeout`, `batch`, `debounce`
- **Sync Pipeline**: `pipeSync` for better performance with synchronous functions
- **Lazy Evaluation**: `lazyPipe` with chainable operations
- **Debugging Tools**: `inspect`, `trace`, `log`, `assert`, `PipelineDebugger`

#### Documentation
- Comprehensive README with usage examples
- API reference documentation
- Performance comparison with other libraries
- Test coverage statistics (97.45%)

#### Package Improvements
- Updated package.json with proper metadata
- Added more keywords for better discoverability
- Configured for tree-shaking with `sideEffects: false`
- Set minimum Node.js version to 16.0.0

### Changed
- Updated package description to reflect ROP focus
- Improved type safety across all operations
- Enhanced error handling patterns

### Technical Details
- **Test Coverage**: 97.45% overall coverage
  - Statements: 97.45%
  - Branches: 98.11%
  - Functions: 94.73%
  - Lines: 97.45%
- **Bundle Size**: ~5KB (minified)
- **Dependencies**: Still zero dependencies
- **TypeScript Support**: Full type safety with inference

## [0.1.2] - Previous Release

### Added
- Basic pipeline composition
- Result type with Success/Failure
- Simple async/sync function support
- Basic error handling

### Features in v0.1.2
- Type-safe function composition
- Supports both synchronous and asynchronous functions
- Handles success and failure cases with unified `Result` type