# Video Studio Application

A professional Windows desktop application for video capturing, recording, and streaming. Built to rival industry standards like OBS Studio and ManyCam, offering a completely custom and unique UI/UX.

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Desktop Container**: Electron (with strict Context Isolation)
- **Native Engine**: C++ 17, CMake, MSVC, Windows SDK
- **Media Processing**: FFmpeg (Shared & Dev Builds)
- **Backend (Future)**: Node.js, PostgreSQL

## Architecture
The application is separated into a lightweight UI renderer (React) and a high-performance native composition engine (C++). Electron serves as the secure bridge. See `docs/architecture.md` for a detailed breakdown.

## Folder Structure
```text
project-root/
├── desktop/       # Electron Main, Preload, and React Renderer
├── engine/        # C++ Native Engine & CMake configurations
├── backend/       # Node.js API (Future)
├── admin/         # Internal dashboard (Future)
├── website/       # Public marketing site (Future)
├── shared/        # Shared TypeScript types
├── tests/         # E2E & Integration tests
├── docs/          # Technical documentation
└── scripts/       # Build & deployment scripts
```

## Development Requirements
- Windows 10/11
- Node.js 22 LTS
- Visual Studio 2022 (C++ Desktop Workload, MSVC v143, Windows 11 SDK)
- CMake 3.15+
- FFmpeg (Windows Shared/Dev GPL Build) installed in `engine/third_party/ffmpeg`

## Installation
1. Clone the repository.
2. Run `npm install` in the root to install all workspace dependencies.

## Running the Desktop Application
```bash
cd desktop
npm run dev
```
*(This starts both the Vite dev server for React and the Electron app simultaneously).*

## Building the Desktop Application
```bash
cd desktop
npm run build
```
*(This compiles React via Vite, compiles Electron via tsc, and packages the app using electron-builder).*

## Building the C++ Engine
```bash
cd engine
mkdir build
cd build
cmake ..
cmake --build . --config Debug
```

## Running Tests
- **C++ Engine**: Run `.\engine\build\Debug\EngineTest.exe`
- **Frontend**: E2E testing to be implemented.

## Development Conventions
- **No API keys or Secrets in source code.** Use `.env` files (see `.env.example` in backend).
- **No direct IPC rendering:** Video frames stay in the C++ layer. React only sends state changes.
- **Strict TypeScript:** Keep `strict: true` enabled across all TSConfigs.

## Security Rules
1. Electron `nodeIntegration` MUST be `false`.
2. Electron `contextIsolation` MUST be `true`.
3. Use `preload.ts` exclusively to bridge functionality.
4. Validate all data crossing the IPC boundary.

## Future Development Phases
- Step 4: Core Engine Capture (C++ Windows Graphics Capture)
- Step 5: Scene Compositing & Mixing
- Step 6: Audio Processing (WASAPI)
- Step 7: Recording & Streaming (FFmpeg integration)
- Step 8: Backend & Authentication
