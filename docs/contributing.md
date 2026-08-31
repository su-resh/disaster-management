# Contributing Guidelines

## How to Contribute

We welcome contributions from the community! Here's how you can get involved:

### 1. Fork the Repository
Click the "Fork" button at the top right of the repository page to create your own copy.

### 2. Create a Feature Branch
Use descriptive branch names following this convention:
- `feature/[feature-name]` for new features
- `bugfix/[issue-number]` for bug fixes
- `docs/[documentation-type]` for documentation changes

### 3. Install Dependencies

#### Flutter
```bash
cd mobile
flutter pub get
```

#### Next.js
```bash
cd dashboard
npm install
```

### 3. Make Your Changes

- **Code Style**: Follow existing project conventions
- **Testing**: Add tests for new functionality
- **Documentation**: Update relevant documentation files
- **Commit Messages**: Use clear, descriptive messages

### 4. Testing

#### Flutter
```bash
flutter test
```

### Next.js
```bash
npm test
```

### Code Quality
- Run `flutter analyze` or `npm run lint` before submitting
- Ensure all tests pass

### 5. Submit a Pull Request

1. Push your changes to your fork
2. Open a pull request against the main repository
3. Include a clear description of your changes
4. Reference any related issues

## Contribution Areas

- **New Features**: Add functionality that enhances disaster response capabilities
- **Bug Fixes**: Fix bugs in existing codebase
- **Documentation**: Improve or create documentation
- **Testing**: Add test coverage for new features
- **Performance**: Optimize existing code for better performance

## Coding Standards

- **Flutter**: Follow Dart style guide and Flutter widget conventions
- **Next.js**: Follow React and Next.js style guidelines
- **Code Comments**: Use meaningful comments, avoid redundancy
- **Variable Naming**: Clear, descriptive names
- **Commit Messages**: Follow conventional commit format

## Issue Reporting

If you find a bug or have a feature request:

1. Search existing issues to ensure it's not already reported
2. Create a new issue with clear description
3. Include steps to reproduce the issue
4. Provide relevant screenshots or logs

## Code of Conduct

We expect all contributors to follow the Contributor Covenant Code of Conduct. Please read the full document in the `.github` directory.

## Maintainer Decision

The lead maintainer reserves the right to reject changes that:
- Don't align with the project's core purpose
- Introduce breaking changes without backward compatibility
- Violate security or privacy principles
- Lack proper documentation or tests

## Recognition

Contributors who make meaningful contributions may be recognized as official maintainers or receive special badges in the README.