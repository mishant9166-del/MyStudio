#include "ScreenCaptureManager.h"
#include <iostream>

#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dxgi.lib")

using namespace vs_engine::capture;

ScreenCaptureManager::ScreenCaptureManager() {}

ScreenCaptureManager::~ScreenCaptureManager() {
    stopCapture();
}

std::vector<DisplayDevice> ScreenCaptureManager::getDisplays() {
    std::vector<DisplayDevice> displays;
    IDXGIFactory1* factory = nullptr;
    if (FAILED(CreateDXGIFactory1(__uuidof(IDXGIFactory1), (void**)&factory))) return displays;

    IDXGIAdapter1* adapter = nullptr;
    if (SUCCEEDED(factory->EnumAdapters1(0, &adapter))) {
        IDXGIOutput* output = nullptr;
        UINT i = 0;
        while (adapter->EnumOutputs(i, &output) != DXGI_ERROR_NOT_FOUND) {
            DXGI_OUTPUT_DESC desc;
            output->GetDesc(&desc);

            int width = desc.DesktopCoordinates.right - desc.DesktopCoordinates.left;
            int height = desc.DesktopCoordinates.bottom - desc.DesktopCoordinates.top;
            
            char name[128];
            WideCharToMultiByte(CP_UTF8, 0, desc.DeviceName, -1, name, sizeof(name), NULL, NULL);

            displays.push_back({
                std::to_string(i),
                std::string(name),
                width,
                height,
                (i == 0) // Assume 0 is primary for now
            });

            output->Release();
            i++;
        }
        adapter->Release();
    }
    factory->Release();
    return displays;
}

bool ScreenCaptureManager::initDXGI(int displayIndex) {
    D3D_FEATURE_LEVEL featureLevel;
    HRESULT hr = D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0, nullptr, 0, 
                                   D3D11_SDK_VERSION, &d3dDevice, &featureLevel, &d3dContext);
    if (FAILED(hr)) return false;

    IDXGIDevice* dxgiDevice = nullptr;
    hr = d3dDevice->QueryInterface(__uuidof(IDXGIDevice), (void**)&dxgiDevice);
    if (FAILED(hr)) return false;

    IDXGIAdapter* dxgiAdapter = nullptr;
    hr = dxgiDevice->GetParent(__uuidof(IDXGIAdapter), (void**)&dxgiAdapter);
    dxgiDevice->Release();
    if (FAILED(hr)) return false;

    IDXGIOutput* dxgiOutput = nullptr;
    hr = dxgiAdapter->EnumOutputs(displayIndex, &dxgiOutput);
    dxgiAdapter->Release();
    if (FAILED(hr)) return false;

    IDXGIOutput1* dxgiOutput1 = nullptr;
    hr = dxgiOutput->QueryInterface(__uuidof(IDXGIOutput1), (void**)&dxgiOutput1);
    dxgiOutput->Release();
    if (FAILED(hr)) return false;

    hr = dxgiOutput1->DuplicateOutput(d3dDevice, &deskDupl);
    dxgiOutput1->Release();
    if (FAILED(hr)) return false;

    DXGI_OUTDUPL_DESC duplDesc;
    deskDupl->GetDesc(&duplDesc);
    currentWidth = duplDesc.ModeDesc.Width;
    currentHeight = duplDesc.ModeDesc.Height;

    D3D11_TEXTURE2D_DESC desc = {};
    desc.Width = currentWidth;
    desc.Height = currentHeight;
    desc.MipLevels = 1;
    desc.ArraySize = 1;
    desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    desc.SampleDesc.Count = 1;
    desc.Usage = D3D11_USAGE_STAGING;
    desc.BindFlags = 0;
    desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    desc.MiscFlags = 0;

    hr = d3dDevice->CreateTexture2D(&desc, nullptr, &stagingTexture);
    return SUCCEEDED(hr);
}

bool ScreenCaptureManager::startCapture(const std::string& displayId, std::function<void(const uint8_t*, size_t, int, int)> frameCallback) {
    std::lock_guard<std::mutex> lock(captureMutex);
    if (isCapturing) return false;

    int displayIdx = 0;
    try { displayIdx = std::stoi(displayId); } catch(...) {}

    if (!initDXGI(displayIdx)) {
        if (deskDupl) deskDupl->Release(); deskDupl = nullptr;
        if (stagingTexture) stagingTexture->Release(); stagingTexture = nullptr;
        if (d3dContext) d3dContext->Release(); d3dContext = nullptr;
        if (d3dDevice) d3dDevice->Release(); d3dDevice = nullptr;
        return false;
    }

    onFrame = frameCallback;
    isCapturing = true;
    captureThread = std::thread(&ScreenCaptureManager::captureLoop, this);
    return true;
}

void ScreenCaptureManager::stopCapture() {
    std::lock_guard<std::mutex> lock(captureMutex);
    isCapturing = false;
    if (captureThread.joinable()) {
        captureThread.join();
    }
    
    if (deskDupl) { deskDupl->Release(); deskDupl = nullptr; }
    if (stagingTexture) { stagingTexture->Release(); stagingTexture = nullptr; }
    if (d3dContext) { d3dContext->Release(); d3dContext = nullptr; }
    if (d3dDevice) { d3dDevice->Release(); d3dDevice = nullptr; }
}

void ScreenCaptureManager::captureLoop() {
    while (isCapturing) {
        IDXGIResource* desktopResource = nullptr;
        DXGI_OUTDUPL_FRAME_INFO frameInfo;
        
        // Wait up to 33ms (approx 30 FPS) for a new frame. DXGI blocks efficiently.
        HRESULT hr = deskDupl->AcquireNextFrame(33, &frameInfo, &desktopResource);
        
        if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
            continue; // No new frame yet
        }
        if (FAILED(hr)) {
            // Lost access (e.g. UAC prompt, resolution change, or monitor disconnected)
            break;
        }

        ID3D11Texture2D* acquiredDesktopImage = nullptr;
        hr = desktopResource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&acquiredDesktopImage);
        desktopResource->Release();

        if (SUCCEEDED(hr)) {
            // Copy from GPU to CPU staging texture
            d3dContext->CopyResource(stagingTexture, acquiredDesktopImage);
            acquiredDesktopImage->Release();

            D3D11_MAPPED_SUBRESOURCE mapped;
            if (SUCCEEDED(d3dContext->Map(stagingTexture, 0, D3D11_MAP_READ, 0, &mapped))) {
                if (onFrame) {
                    // Pass the raw BGRA bytes. 
                    // Note: DXGI_FORMAT_B8G8R8A8_UNORM is 4 bytes per pixel.
                    // mapped.RowPitch might be larger than width * 4 due to padding.
                    // For milestone 1, we pass it down and let the renderer handle pitch or assume contiguous.
                    // Better: copy to contiguous buffer if rowPitch != width * 4, but let's pass it raw for performance.
                    // Actually, to ensure stable rendering in Canvas, we MUST make it contiguous if padded.
                    
                    if (mapped.RowPitch == currentWidth * 4) {
                        onFrame((const uint8_t*)mapped.pData, currentWidth * currentHeight * 4, currentWidth, currentHeight);
                    } else {
                        // Needs contiguous buffer
                        std::vector<uint8_t> contiguous(currentWidth * currentHeight * 4);
                        for (int y = 0; y < currentHeight; y++) {
                            memcpy(contiguous.data() + y * currentWidth * 4, 
                                   (uint8_t*)mapped.pData + y * mapped.RowPitch, 
                                   currentWidth * 4);
                        }
                        onFrame(contiguous.data(), contiguous.size(), currentWidth, currentHeight);
                    }
                }
                d3dContext->Unmap(stagingTexture, 0);
            }
        }
        deskDupl->ReleaseFrame();
    }
}
