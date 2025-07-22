# Node.js Setup for Therajai

This document explains how to properly set up Node.js for the Therajai project to avoid compatibility issues.

## Requirements

- **Node.js**: >=18.17.0 (recommended: v20.19.0)
- **npm**: >=8.0.0
- **nvm**: Recommended for managing Node.js versions

## Quick Setup

### 1. Automatic Setup (Recommended)

```bash
npm run setup
```

This will automatically:
- Check if the correct Node.js version is installed
- Install it if missing
- Switch to the correct version
- Set it as default

### 2. Manual Setup

If you prefer to set up manually:

```bash
# Install the required Node.js version
nvm install v20.19.0

# Use the version
nvm use v20.19.0

# Set as default
nvm alias default v20.19.0

# Verify
node --version  # Should show v20.19.0
```

## Why This Matters

- **Next.js 14** requires Node.js >=18.17.0
- The project was previously running on Node.js 18.14.0, causing compatibility issues
- Using an incompatible version will result in build failures and runtime errors

## Project Files

The following files ensure consistent Node.js usage:

- **`.nvmrc`**: Specifies the exact Node.js version (v20.19.0)
- **`package.json`**: Contains `engines` field documenting requirements
- **`scripts/setup-node.sh`**: Automated setup script

## Common Issues

### Problem: "Node.js version >= v18.17.0 is required"
**Solution**: Run `npm run setup` or manually switch to the correct version

### Problem: nvm not found
**Solution**: Install nvm from https://github.com/nvm-sh/nvm

### Problem: Version doesn't persist after restarting terminal
**Solution**: Run `nvm alias default v20.19.0` to set as default

## Development Workflow

1. **First time setup**:
   ```bash
   npm run setup
   npm install
   npm run dev
   ```

2. **Switching between projects**:
   ```bash
   nvm use  # Automatically uses version from .nvmrc
   ```

3. **Verifying your setup**:
   ```bash
   node --version   # Should show v20.19.0
   npm --version    # Should show >=8.0.0
   ```

## Benefits of This Setup

✅ **Consistent environment** across all developers
✅ **No more compatibility issues** with Next.js 14
✅ **Automatic version switching** when entering the project directory
✅ **Future-proof** for Next.js updates
✅ **Easy onboarding** for new team members

## Additional Notes

- The `.nvmrc` file allows `nvm use` to automatically select the correct version
- The `engines` field in `package.json` documents the requirements for deployment
- The setup script can be run multiple times safely
- This setup is compatible with all major deployment platforms (Vercel, Netlify, etc.)

## Troubleshooting

If you encounter any issues:

1. Ensure nvm is properly installed and sourced
2. Restart your terminal after nvm installation
3. Run `source ~/.nvm/nvm.sh` to reload nvm
4. Contact the development team if problems persist

---

**Remember**: Always use the correct Node.js version to avoid compatibility issues!