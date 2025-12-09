class VirtualFileSystem {
  constructor() {
    this.fs = null;
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem("virtualFileSystem");
      if (stored) {
        this.fs = JSON.parse(stored);
      } else {
        this.fs = this.createDefaultStructure();
        this.save();
      }
    } catch (error) {
      this.fs = this.createDefaultStructure();
      this.save();
    }
  }

  createDefaultStructure() {
    return {
      "/": {
        type: "directory",
        children: {
          home: {
            type: "directory",
            children: {
              user: {
                type: "directory",
                children: {
                  "welcome.txt": {
                    type: "file",
                    content:
                      "Welcome to CyberTerm!\n\nThis is a fully functional virtual filesystem.\nYou can create, read, and delete files and directories.\n\nTry the following commands:\n- ls\n- cat welcome.txt\n- touch newfile.txt\n- mkdir newfolder",
                  },
                  "readme.md": {
                    type: "file",
                    content:
                      "# CyberTerm README\n\nVersion: 1.0.0\n\n## Features\n- Full terminal emulation\n- Virtual filesystem\n- Multiple themes\n- Real-time widgets\n- API integrations",
                  },
                  ".bashrc": {
                    type: "file",
                    content:
                      '# Bash configuration\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -la"\nalias ..="cd .."\n',
                  },
                },
              },
            },
          },
          etc: {
            type: "directory",
            children: {
              hosts: {
                type: "file",
                content:
                  "127.0.0.1 localhost\n::1 localhost\n127.0.1.1 cyberterm",
              },
              motd: {
                type: "file",
                content:
                  'Welcome to CyberTerm Linux!\nType "help" for available commands.',
              },
            },
          },
          logs: {
            type: "directory",
            children: {
              "system.log": {
                type: "file",
                content:
                  "[INIT] System initialized\n[INFO] All services started\n[OK] Ready for commands",
              },
            },
          },
          modules: {
            type: "directory",
            children: {},
          },
        },
      },
    };
  }

  save() {
    chrome.storage.sync.set({ virtualFileSystem: this.fs });
  }

  parsePath(path) {
    if (path === "/") return ["/"];
    return path.split("/").filter((p) => p !== "");
  }

  resolvePath(currentPath, targetPath) {
    if (targetPath.startsWith("/")) {
      return targetPath;
    }

    if (targetPath === ".") {
      return currentPath;
    }

    if (targetPath === "..") {
      const parts = this.parsePath(currentPath);
      parts.pop();
      return parts.length === 0 ? "/" : "/" + parts.join("/");
    }

    if (currentPath === "/") {
      return "/" + targetPath;
    }

    return currentPath + "/" + targetPath;
  }

  getNode(path) {
    if (path === "/") {
      return this.fs["/"];
    }

    const parts = this.parsePath(path);
    let current = this.fs["/"];

    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        throw new Error(`bash: cd: ${path}: No such file or directory`);
      }
      current = current.children[part];
    }

    return current;
  }

  listDirectory(path) {
    const node = this.getNode(path);

    if (node.type !== "directory") {
      throw new Error(`bash: ls: ${path}: Not a directory`);
    }

    if (!node.children) {
      return [];
    }

    return Object.entries(node.children).map(([name, child]) => ({
      name,
      type: child.type,
    }));
  }

  changePath(currentPath, targetPath) {
    const fullPath = this.resolvePath(currentPath, targetPath);
    const node = this.getNode(fullPath);

    if (node.type !== "directory") {
      throw new Error(`bash: cd: ${targetPath}: Not a directory`);
    }

    return fullPath;
  }

  readFile(currentPath, filename) {
    const fullPath = this.resolvePath(currentPath, filename);
    const node = this.getNode(fullPath);

    if (node.type !== "file") {
      throw new Error(`bash: cat: ${filename}: Is a directory`);
    }

    return node.content || "";
  }

  createFile(currentPath, filename, content = "") {
    const dir = this.getNode(currentPath);

    if (dir.type !== "directory") {
      throw new Error(`bash: touch: ${currentPath}: Not a directory`);
    }

    if (!dir.children) {
      dir.children = {};
    }

    if (dir.children[filename]) {
      throw new Error(`bash: touch: ${filename}: File exists`);
    }

    dir.children[filename] = {
      type: "file",
      content: content,
    };

    this.save();
  }

  deleteFile(currentPath, filename) {
    const dir = this.getNode(currentPath);

    if (dir.type !== "directory") {
      throw new Error(`bash: rm: ${currentPath}: Not a directory`);
    }

    if (!dir.children || !dir.children[filename]) {
      throw new Error(`bash: rm: ${filename}: No such file or directory`);
    }

    if (dir.children[filename].type === "directory") {
      throw new Error(`bash: rm: ${filename}: Is a directory`);
    }

    delete dir.children[filename];
    this.save();
  }

  createDirectory(currentPath, dirname) {
    const dir = this.getNode(currentPath);

    if (dir.type !== "directory") {
      throw new Error(`bash: mkdir: ${currentPath}: Not a directory`);
    }

    if (!dir.children) {
      dir.children = {};
    }

    if (dir.children[dirname]) {
      throw new Error(`bash: mkdir: ${dirname}: File exists`);
    }

    dir.children[dirname] = {
      type: "directory",
      children: {},
    };

    this.save();
  }

  deleteDirectory(currentPath, dirname) {
    const dir = this.getNode(currentPath);

    if (dir.type !== "directory") {
      throw new Error(`bash: rmdir: ${currentPath}: Not a directory`);
    }

    if (!dir.children || !dir.children[dirname]) {
      throw new Error(`bash: rmdir: ${dirname}: No such file or directory`);
    }

    const target = dir.children[dirname];

    if (target.type !== "directory") {
      throw new Error(`bash: rmdir: ${dirname}: Not a directory`);
    }

    if (target.children && Object.keys(target.children).length > 0) {
      throw new Error(`bash: rmdir: ${dirname}: Directory not empty`);
    }

    delete dir.children[dirname];
    this.save();
  }

  writeFile(currentPath, filename, content) {
    const fullPath = this.resolvePath(currentPath, filename);
    const node = this.getNode(fullPath);

    if (node.type !== "file") {
      throw new Error(`bash: write: ${filename}: Is a directory`);
    }

    node.content = content;
    this.save();
  }
}

// Initialize filesystem
const fileSystem = new VirtualFileSystem();
