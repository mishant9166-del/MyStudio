# Application Architecture

## High-Level Overview
The Video Studio Application is designed to maintain strict boundaries between its presentation layer (UI) and its heavy computational layer (Video/Audio processing). 

### 1. The React Renderer (UI)
Located in `desktop/renderer`, this is a standard Vite+React SPA. It is responsible solely for rendering the user interface (Scenes, Sources, Mixer) and handling user interactions. It has NO access to Node.js APIs or the file system.

### 2. The Electron Main Process (The Bridge)
Located in `desktop/electron`, this process manages OS-level windows, application lifecycle, and securely exposes specific functions to the React renderer via `preload.ts`. It acts as the orchestrator, passing commands from the UI down to the C++ Engine.

### 3. The C++ Native Engine (The Heavy Lifter)
Located in `engine/`, this is where all high-performance tasks occur:
- Capturing windows/screens using Windows Graphics Capture.
- Compositing scenes using Direct3D or OpenGL.
- Processing audio streams.
- Encoding video using FFmpeg.

### IPC Communication Flow
The golden rule of this architecture is **State Only over IPC**. 
We do not serialize and pass 60fps video frames through Electron's IPC bridge, as that would bottleneck the CPU.
Instead, the Native Engine renders the composited video frame directly to a shared texture or an OS-level window overlay, while React simply sends configuration commands (e.g., `setSourcePosition(id, x, y)`).

### Future Integrations
- **Backend API**: The Electron main process will securely authenticate with the Node.js backend using JWTs, validating licenses and subscriptions without exposing secrets to the frontend.
