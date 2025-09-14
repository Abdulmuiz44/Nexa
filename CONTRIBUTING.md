# Contributing to Nexa

Thank you for your interest in contributing to Nexa! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. **Fork and clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/nexa.git
   cd nexa
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment**
   \`\`\`bash
   cp .env.example .env.local
   # Add your API keys and configuration
   \`\`\`

4. **Run tests to ensure everything works**
   \`\`\`bash
   npm run check
   \`\`\`

### Development Workflow

1. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

2. **Make your changes**
   - Write code following our style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   \`\`\`bash
   npm run check  # Runs lint, type-check, and tests
   npm run test:e2e  # Run E2E tests
   \`\`\`

4. **Commit your changes**
   \`\`\`bash
   git add .
   git commit -m "feat: add new skill for content optimization"
   \`\`\`

5. **Push and create a pull request**
   \`\`\`bash
   git push origin feature/your-feature-name
   \`\`\`

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Avoid `any` types - use proper type definitions
- Use interfaces for object shapes
- Use enums for constants with multiple values

### Code Formatting

We use Prettier and ESLint for code formatting:

\`\`\`bash
npm run format      # Format code
npm run lint        # Check linting
npm run lint:fix    # Fix linting issues
\`\`\`

### Commit Messages

Follow conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

Examples:
\`\`\`
feat: add Twitter posting skill
fix: handle rate limiting in LLM wrapper
docs: update API documentation
test: add unit tests for agent runner
\`\`\`

## 🧪 Testing Guidelines

### Unit Tests

- Write unit tests for all new functions and classes
- Use Jest and Testing Library for React components
- Mock external dependencies
- Aim for >70% code coverage

\`\`\`bash
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
\`\`\`

### Integration Tests

- Test API endpoints with real database interactions
- Use test database for integration tests
- Clean up test data after each test

### E2E Tests

- Use Playwright for end-to-end testing
- Test critical user journeys
- Run E2E tests before major releases

\`\`\`bash
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Run with UI
\`\`\`

## 🏗️ Architecture Guidelines

### Agent Skills

When adding new skills:

1. **Implement the Skill interface**
   \`\`\`typescript
   export class MySkill implements Skill {
     name = "my-skill"
     description = "Description of what this skill does"
     
     async execute(payload: any): Promise<SkillResult> {
       // Implementation
     }
   }
   \`\`\`

2. **Register the skill**
   \`\`\`typescript
   skillRegistry.registerSkill("my-skill", new MySkill())
   \`\`\`

3. **Add tests**
   \`\`\`typescript
   describe("MySkill", () => {
     it("should execute successfully", async () => {
       // Test implementation
     })
   })
   \`\`\`

### API Endpoints

- Use Next.js App Router for new API routes
- Implement proper error handling
- Add input validation with Zod
- Include rate limiting for public endpoints
- Add comprehensive tests

### Database Changes

- Use Prisma for database schema changes
- Create migrations for schema updates
- Update seed data if necessary
- Test migrations on development database

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms and business logic
- Include examples in documentation

### API Documentation

- Update OpenAPI/Swagger specs for API changes
- Include request/response examples
- Document error codes and messages

## 🐛 Bug Reports

When reporting bugs:

1. **Use the issue template**
2. **Provide reproduction steps**
3. **Include environment information**
4. **Add relevant logs or screenshots**

## 💡 Feature Requests

When requesting features:

1. **Describe the use case**
2. **Explain the expected behavior**
3. **Consider implementation complexity**
4. **Discuss alternatives**

## 🔍 Code Review Process

### For Contributors

- Keep PRs focused and small
- Write clear PR descriptions
- Respond to feedback promptly
- Update documentation as needed

### For Reviewers

- Review code for correctness and style
- Check test coverage
- Verify documentation updates
- Test functionality locally

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm run check`)
- [ ] New functionality has tests
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

## 🏷️ Release Process

1. **Version Bump**
   \`\`\`bash
   npm version patch|minor|major
   \`\`\`

2. **Update Changelog**
   - Add new features and fixes
   - Follow Keep a Changelog format

3. **Create Release**
   - Tag the release
   - Create GitHub release with notes

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct

## 📞 Getting Help

- 💬 [GitHub Discussions](https://github.com/your-username/nexa/discussions)
- 🐛 [Issue Tracker](https://github.com/your-username/nexa/issues)
- 📖 [Documentation](./docs/)

Thank you for contributing to Nexa! 🚀
