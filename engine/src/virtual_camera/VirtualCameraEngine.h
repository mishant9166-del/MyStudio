#pragma once
#include <windows.h>
#include <vector>
#include <string>

namespace vs_engine {

class VirtualCameraEngine {
public:
    static VirtualCameraEngine& getInstance() {
        static VirtualCameraEngine instance;
        return instance;
    }

    bool start();
    void stop();
    bool isRunning() const { return m_running; }

    // Push 1080p BGRA frame
    void pushFrame(const unsigned char* buffer, size_t length);

private:
    VirtualCameraEngine();
    ~VirtualCameraEngine();

    bool m_running;
    HANDLE m_hMapFile;
    unsigned char* m_pBuf;
    HANDLE m_hEvent;
};

} // namespace vs_engine
