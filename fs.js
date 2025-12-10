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
    try {
      localStorage.setItem("virtualFileSystem", JSON.stringify(this.fs));
    } catch (error) {
      console.error("Failed to save filesystem:", error);
    }
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

  copyFile(currentPath, source, destination) {
    const sourcePath = this.resolvePath(currentPath, source);
    const sourceNode = this.getNode(sourcePath);

    if (sourceNode.type !== "file") {
      throw new Error(
        `bash: cp: ${source}: Is a directory (use -r for directories)`
      );
    }

    // Check if destination is a directory
    let destPath;
    try {
      const destNode = this.getNode(this.resolvePath(currentPath, destination));
      if (destNode.type === "directory") {
        // Copy into directory with same filename
        const filename = source.split("/").pop();
        destPath = this.resolvePath(currentPath, destination) + "/" + filename;
      } else {
        destPath = this.resolvePath(currentPath, destination);
      }
    } catch {
      // Destination doesn't exist, use as new filename
      destPath = this.resolvePath(currentPath, destination);
    }

    // Get parent directory
    const parts = this.parsePath(destPath);
    const filename = parts.pop();
    const parentPath = parts.length === 0 ? "/" : "/" + parts.join("/");
    const parentNode = this.getNode(parentPath);

    if (!parentNode.children) {
      parentNode.children = {};
    }

    // Copy file
    parentNode.children[filename] = {
      type: "file",
      content: sourceNode.content || "",
    };

    this.save();
  }

  copyDirectory(currentPath, source, destination) {
    const sourcePath = this.resolvePath(currentPath, source);
    const sourceNode = this.getNode(sourcePath);

    if (sourceNode.type !== "directory") {
      throw new Error(`bash: cp: ${source}: Not a directory`);
    }

    // Get destination path
    let destPath = this.resolvePath(currentPath, destination);
    const parts = this.parsePath(destPath);
    const dirname = parts.pop();
    const parentPath = parts.length === 0 ? "/" : "/" + parts.join("/");
    const parentNode = this.getNode(parentPath);

    if (!parentNode.children) {
      parentNode.children = {};
    }

    // Deep copy directory
    parentNode.children[dirname] = this.deepCopyNode(sourceNode);
    this.save();
  }

  deepCopyNode(node) {
    if (node.type === "file") {
      return {
        type: "file",
        content: node.content || "",
      };
    } else {
      const newNode = {
        type: "directory",
        children: {},
      };

      if (node.children) {
        for (const [name, child] of Object.entries(node.children)) {
          newNode.children[name] = this.deepCopyNode(child);
        }
      }

      return newNode;
    }
  }

  moveFile(currentPath, source, destination) {
    const sourcePath = this.resolvePath(currentPath, source);
    const sourceNode = this.getNode(sourcePath);

    // Get source parent
    const sourceParts = this.parsePath(sourcePath);
    const sourceFilename = sourceParts.pop();
    const sourceParentPath =
      sourceParts.length === 0 ? "/" : "/" + sourceParts.join("/");
    const sourceParent = this.getNode(sourceParentPath);

    // Check if destination is a directory
    let destPath;
    let destFilename;
    try {
      const destNode = this.getNode(this.resolvePath(currentPath, destination));
      if (destNode.type === "directory") {
        // Move into directory with same filename
        destPath = this.resolvePath(currentPath, destination);
        destFilename = sourceFilename;
      } else {
        // Destination exists as file, overwrite
        destPath = this.resolvePath(currentPath, destination);
        const destParts = this.parsePath(destPath);
        destFilename = destParts.pop();
        destPath = destParts.length === 0 ? "/" : "/" + destParts.join("/");
      }
    } catch {
      // Destination doesn't exist, use as new filename
      const fullDestPath = this.resolvePath(currentPath, destination);
      const destParts = this.parsePath(fullDestPath);
      destFilename = destParts.pop();
      destPath = destParts.length === 0 ? "/" : "/" + destParts.join("/");
    }

    const destParent = this.getNode(destPath);

    if (!destParent.children) {
      destParent.children = {};
    }

    // Move (copy then delete)
    destParent.children[destFilename] = sourceNode;
    delete sourceParent.children[sourceFilename];

    this.save();
  }

  renameFile(currentPath, oldName, newName) {
    const dir = this.getNode(currentPath);

    if (dir.type !== "directory") {
      throw new Error(`bash: mv: ${currentPath}: Not a directory`);
    }

    if (!dir.children || !dir.children[oldName]) {
      throw new Error(`bash: mv: ${oldName}: No such file or directory`);
    }

    if (dir.children[newName]) {
      throw new Error(`bash: mv: ${newName}: File exists`);
    }

    dir.children[newName] = dir.children[oldName];
    delete dir.children[oldName];

    this.save();
  }
}

// Initialize filesystem
const fileSystem = new VirtualFileSystem();
