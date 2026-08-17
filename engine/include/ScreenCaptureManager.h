#pragma once
#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <thread>
#include <atomic>
#include <mutex>
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>

namespace vs_engine {
namespace capture {

struct DisplayDevice {
    std::string id;
    std::string name;
    int width;
    int height;
    bool isPrimary;
};

class ScreenCaptureManager {
public:
    ScreenCaptureManager();
    ~ScreenCaptureManager();

    std::vector<DisplayDevice> getDisplays();
    bool startCapture(const std::string& displayId, std::function<void(const uint8_t*, size_t, int, int)> frameCallback);
    void stopCapture();

private:
    void captureLoop();
    bool initDXGI(int displayIndex);

    std::thread captureThread;
    std::atomic<bool> isCapturing{false};
    std::mutex captureMutex;
    std::function<void(const uint8_t*, size_t, int, int)> onFrame;

    ID3D11Device* d3dDevice = nullptr;
    ID3D11DeviceContext* d3dContext = nullptr;
    IDXGIOutputDuplication* deskDupl = nullptr;
    ID3D11Texture2D* stagingTexture = nullptr;

    int currentWidth = 0;
    int currentHeight = 0;
};

} // namespace capture
} // namespace vs_engine
