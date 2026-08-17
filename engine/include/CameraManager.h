#pragma once
#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <thread>
#include <atomic>
#include <mutex>
#include <windows.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>

namespace vs_engine {
namespace capture {

struct CameraDevice {
    std::string id;
    std::string name;
};

class CameraManager {
public:
    CameraManager();
    ~CameraManager();

    std::vector<CameraDevice> getDevices();
    bool startCapture(const std::string& deviceId, std::function<void(const uint8_t*, size_t, int, int)> frameCallback);
    void stopCapture();

private:
    void captureLoop();

    IMFSourceReader* sourceReader = nullptr;
    std::thread captureThread;
    std::atomic<bool> isCapturing{false};
    std::mutex captureMutex;
    std::function<void(const uint8_t*, size_t, int, int)> onFrame;
    
    int currentWidth = 0;
    int currentHeight = 0;
};

} // namespace capture
} // namespace vs_engine
