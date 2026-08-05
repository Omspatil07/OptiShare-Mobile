# OptiShare Mobile

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)](https://reactnative.dev/)

> **Open-Source Offline Optical File Transfer Application**

OptiShare transfers files between devices using only the **Screen** and **Camera**. It requires **NO Wi-Fi, Bluetooth, NFC, Internet, or USB cables**.

---

## 🚀 Key Features & Principles

- 📱 **Optical Channel**: Animated visual codes stream data between devices.
- 🔒 **Zero Network Requirement**: Operating system-level isolation (no `INTERNET` permission requested).
- ⚡ **High Performance**: Built with Clean Architecture, Zustand, React Native Skia, and native C++/JSI modules.
- 🛡️ **End-to-End Encryption**: Ephemeral session keys with AES-256-GCM authenticated encryption.
- 🩹 **Forward Error Correction**: Reed-Solomon error correction handles real-world optical noise.
- 📦 **Compression**: zstd stream compression reduces visual frame load.

---

## 🛠️ Tech Stack Overview

- **Core**: React Native (New Architecture, Hermes Engine), TypeScript (Strict Mode)
- **State Management**: Zustand
- **Graphics & Vision**: React Native Skia, React Native Vision Camera
- **Native Extensions**: C++ (Shared engine), Kotlin (Android), Swift (iOS)
- **Quality Gates**: ESLint, Prettier, Husky, lint-staged, Commitlint, Jest, React Native Testing Library

---

## 📋 Prerequisites

- Node.js >= 22.11.0
- npm >= 10
- JDK 17 (for Android)
- Android Studio & Android SDK (API 26+)
- Xcode 15+ & CocoaPods (for iOS)

---

## ⚡ Quick Start

```bash
# Clone repository
git clone https://github.com/Omspatil07/OptiShare-Mobile.git
cd OptiShare-Mobile

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 🧪 Verification & Tooling Commands

```bash
# Type check
npm run typecheck

# Lint check & fix
npm run lint
npm run lint:fix

# Run tests
npm test
npm run test:coverage

# Format code
npm run format
npm run format:check
```

---

## 📁 Repository Structure

```
src/
├── app/           # Application bootstrap, DI container, environment & constants
├── core/          # Clean Architecture core (domain, infrastructure, use-cases)
├── features/      # Feature modules (send, receive, history, settings, home)
└── shared/        # Shared components, hooks, design theme, utilities, i18n
```

For comprehensive documentation, see the [docs/](./docs) directory.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
