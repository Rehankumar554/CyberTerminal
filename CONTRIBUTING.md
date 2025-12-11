# Contributing to CyberTerminal

First off, thank you for considering contributing to CyberTerminal! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on what is best for the community
- ✅ Show empathy towards others
- ❌ No harassment, trolling, or insulting comments
- ❌ No personal or political attacks
- ❌ No spam or self-promotion

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - Browser [e.g. stock browser, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or screenshots.

**Priority**
Low / Medium / High
```

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Open a Pull Request**

---

## 🛠️ Development Setup

### Prerequisites

- Git
- Chrome Browser (latest version)
- Text Editor (VS Code recommended)
- Basic knowledge of JavaScript

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/rehankumar554/cyberterminal.git
   cd cyberterminal
   ```

2. **Load in Chrome**

   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `cyberterminal` folder

3. **Make changes**

   - Edit files in your preferred editor
   - Reload extension in Chrome to test

4. **Test your changes**
   - Open new tab
   - Test all affected commands
   - Check console for errors

---

## 💻 Coding Standards

### JavaScript Style Guide

```javascript
// ✅ Good
class TerminalCommand {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  execute(args) {
    // Implementation
  }
}

// ❌ Bad
class terminal_command {
  constructor(n, d) {
    this.name = n;
    this.description = d;
  }
  execute(a) {
    // Implementation
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (`TerminalEmulator`)
- **Functions**: camelCase (`executeCommand`)
- **Variables**: camelCase (`currentPath`)
- **Constants**: UPPER_SNAKE_CASE (`API_KEY`)
- **Files**: kebab-case (`terminal-commands.js`)

### Code Organization

```javascript
// 1. Imports (if any)
// 2. Constants
// 3. Class definition
// 4. Constructor
// 5. Public methods
// 6. Private methods
// 7. Export/Initialize
```

### Comments

```javascript
// ✅ Good comments
/**
 * Execute a terminal command
 * @param {string} input - The command input
 * @returns {void}
 */
executeCommand(input) {
  // Parse command and arguments
  const parts = input.split(' ');

  // Execute command if it exists
  if (this.commands[cmd]) {
    this.commands[cmd].call(this, args);
  }
}

// ❌ Bad comments
// this function executes commands
executeCommand(input) {
  const parts = input.split(' '); // split input
  if (this.commands[cmd]) { // check if command exists
    this.commands[cmd].call(this, args); // call it
  }
}
```

### Error Handling

```javascript
// ✅ Good
try {
  const content = fileSystem.readFile(path, filename);
  this.addOutput(content);
} catch (err) {
  this.addOutput(err.message, "error");
  console.error("File read error:", err);
}

// ❌ Bad
const content = fileSystem.readFile(path, filename);
this.addOutput(content);
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build/config changes

### Examples

```bash
# Good commits
feat(terminal): add grep command with recursive search
fix(filesystem): resolve path traversal bug
docs(readme): update installation instructions
style(css): improve theme color consistency
refactor(widgets): extract weather API logic
perf(matrix): optimize canvas rendering
chore(manifest): update version to 1.1.0

# Bad commits
update stuff
fix bug
changes
work in progress
```

### Commit Body (Optional)

```
feat(terminal): add grep command with recursive search

- Implemented grep command for text search
- Added -r flag for recursive directory search
- Added -i flag for case-insensitive search
- Updated help documentation

Closes #123
```

---

## 🔄 Pull Request Process

### Before Submitting

- ✅ Test all changes thoroughly
- ✅ Update documentation
- ✅ Follow coding standards
- ✅ Write clear commit messages
- ✅ Ensure no console errors
- ✅ Check for merge conflicts

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How has this been tested?

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass (if applicable)

## Screenshots (if applicable)

Add screenshots here

## Related Issues

Closes #123
```

### Review Process

1. **Automated checks** (if any)
2. **Code review** by maintainers
3. **Testing** by reviewers
4. **Feedback** and requested changes
5. **Approval** and merge

---

## 🧪 Testing

### Manual Testing Checklist

Before submitting, test:

**File Operations:**

- [ ] `ls`, `cd`, `pwd` work correctly
- [ ] `cat`, `head`, `tail` display content
- [ ] `touch`, `rm` create/delete files
- [ ] `mkdir`, `rmdir` work with directories
- [ ] `cp`, `mv` copy and move files
- [ ] `find`, `grep` search correctly

**Widgets:**

- [ ] Clock updates every second
- [ ] Weather fetches GPS location
- [ ] Crypto prices update
- [ ] System monitor shows usage
- [ ] Logs display correctly

**Visual:**

- [ ] Matrix animation works
- [ ] Themes switch properly
- [ ] No visual glitches
- [ ] Responsive on different sizes

**Commands:**

- [ ] All commands in help work
- [ ] Error messages are clear
- [ ] No console errors

---

## 📚 Documentation

### Updating Documentation

When adding features, update:

1. **README.md** - Add to features list
2. **Command reference** - Add command syntax
3. **Code comments** - Document complex logic
4. **Help command** - Update help text

### Documentation Style

````markdown
# ✅ Good documentation

## grep Command

Search for patterns in files.

**Syntax:**

```bash
grep "pattern" <file>
grep -r "pattern" <path>
grep -i "pattern" <file>
```
````

**Examples:**

```bash
grep "Linux" readme.md
grep -r "error" /logs
grep -i "WELCOME" file.txt
```

**Flags:**

- `-r` - Recursive search
- `-i` - Case-insensitive

---

## 🎯 Areas to Contribute

### High Priority
- Browser tab management
- Clipboard integration
- Settings panel UI
- Session save/restore
- More terminal commands

### Medium Priority
- Custom keybindings
- Themes customization
- Performance optimization
- Better error messages
- More widgets

### Low Priority
- Easter eggs
- ASCII art commands
- Fun animations
- Additional themes
- Sound effects

---

## 📞 Getting Help

Need help contributing?

- 💬 [GitHub Discussions](https://github.com/Rehankumar554/cyberterminal/discussions)
- 📧 Email: work.rehankumarsahu@gmail.com
<!-- - 📖 [Wiki](https://github.com/rehankumar554/cyberterminal/wiki) -->

---

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in commits
- Appreciated forever! 🙏

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Thank you for contributing to CyberTerminal! 🚀**

Every contribution, no matter how small, helps make this project better.

</div>