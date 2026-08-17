#include "CameraManager.h"
#include <iostream>
#include <codecvt>
#include <locale>
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>
#include <mferror.h>
#include <Shlwapi.h>

#pragma comment(lib, "mf.lib")
#pragma comment(lib, "mfplat.lib")
#pragma comment(lib, "mfuuid.lib")
#pragma comment(lib, "mfreadwrite.lib")
#pragma comment(lib, "shlwapi.lib")

using namespace vs_engine::capture;

CameraManager::CameraManager() {
    HRESULT hr = MFStartup(MF_VERSION);
    if (FAILED(hr)) {
        std::cerr << "Failed to initialize Media Foundation" << std::endl;
    }
}

CameraManager::~CameraManager() {
    stopCapture();
    MFShutdown();
}

std::string utf16_to_utf8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

std::vector<CameraDevice> CameraManager::getDevices() {
    std::vector<CameraDevice> devices;
    IMFAttributes* pAttributes = nullptr;
    IMFActivate** ppDevices = nullptr;
    UINT32 count = 0;

    HRESULT hr = MFCreateAttributes(&pAttributes, 1);
    if (SUCCEEDED(hr)) {
        hr = pAttributes->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE, MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
    }
    
    if (SUCCEEDED(hr)) {
        hr = MFEnumDeviceSources(pAttributes, &ppDevices, &count);
    }

    if (SUCCEEDED(hr)) {
        for (UINT32 i = 0; i < count; i++) {
            WCHAR* nameStr = nullptr;
            UINT32 nameLen = 0;
            if (SUCCEEDED(ppDevices[i]->GetAllocatedString(MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME, &nameStr, &nameLen))) {
                
                WCHAR* symLink = nullptr;
                UINT32 symLen = 0;
                std::string idStr = std::to_string(i); // Fallback ID
                if (SUCCEEDED(ppDevices[i]->GetAllocatedString(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_SYMBOLIC_LINK, &symLink, &symLen))) {
                    idStr = utf16_to_utf8(std::wstring(symLink));
                    CoTaskMemFree(symLink);
                }

                devices.push_back({ idStr, utf16_to_utf8(std::wstring(nameStr)) });
                CoTaskMemFree(nameStr);
            }
            ppDevices[i]->Release();
        }
        CoTaskMemFree(ppDevices);
    }

    if (pAttributes) pAttributes->Release();
    return devices;
}

bool CameraManager::startCapture(const std::string& deviceId, std::function<void(const uint8_t*, size_t, int, int)> frameCallback) {
    std::lock_guard<std::mutex> lock(captureMutex);
    if (isCapturing) return false;

    this->onFrame = frameCallback;

    // To keep this reliable for milestone 1, we will grab the first camera.
    // A robust implementation would match the deviceId with the Symbolic Link.
    IMFAttributes* pAttributes = nullptr;
    IMFActivate** ppDevices = nullptr;
    UINT32 count = 0;
    
    HRESULT hr = MFCreateAttributes(&pAttributes, 1);
    if (SUCCEEDED(hr)) {
        hr = pAttributes->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE, MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);
    }
    if (SUCCEEDED(hr)) {
        hr = MFEnumDeviceSources(pAttributes, &ppDevices, &count);
    }

    IMFMediaSource* pSource = nullptr;
    if (SUCCEEDED(hr) && count > 0) {
        // Find by ID or just use first if not found
        bool found = false;
        for (UINT32 i = 0; i < count; i++) {
            WCHAR* symLink = nullptr;
            UINT32 symLen = 0;
            if (SUCCEEDED(ppDevices[i]->GetAllocatedString(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_SYMBOLIC_LINK, &symLink, &symLen))) {
                std::string linkUtf8 = utf16_to_utf8(std::wstring(symLink));
                CoTaskMemFree(symLink);
                if (linkUtf8 == deviceId || deviceId.empty()) {
                    ppDevices[i]->ActivateObject(IID_PPV_ARGS(&pSource));
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            ppDevices[0]->ActivateObject(IID_PPV_ARGS(&pSource));
        }

        for (UINT32 i = 0; i < count; i++) ppDevices[i]->Release();
        CoTaskMemFree(ppDevices);
    }
    if (pAttributes) pAttributes->Release();

    if (!pSource) return false;

    IMFAttributes* pReaderAttrs = nullptr;
    MFCreateAttributes(&pReaderAttrs, 1);
    pReaderAttrs->SetUINT32(MF_SOURCE_READER_ENABLE_VIDEO_PROCESSING, TRUE);
    
    hr = MFCreateSourceReaderFromMediaSource(pSource, pReaderAttrs, &sourceReader);
    pReaderAttrs->Release();
    pSource->Release();

    if (FAILED(hr)) return false;

    // Request RGB32 output for easy canvas rendering (zero-copy ArrayBuffer to ImageData)
    IMFMediaType* pType = nullptr;
    MFCreateMediaType(&pType);
    pType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
    pType->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_RGB32);
    
    hr = sourceReader->SetCurrentMediaType((DWORD)MF_SOURCE_READER_FIRST_VIDEO_STREAM, NULL, pType);
    pType->Release();

    if (FAILED(hr)) {
        sourceReader->Release();
        sourceReader = nullptr;
        return false;
    }

    // Get actual configured resolution
    IMFMediaType* pCurrentType = nullptr;
    if (SUCCEEDED(sourceReader->GetCurrentMediaType((DWORD)MF_SOURCE_READER_FIRST_VIDEO_STREAM, &pCurrentType))) {
        UINT32 w, h;
        if (SUCCEEDED(MFGetAttributeSize(pCurrentType, MF_MT_FRAME_SIZE, &w, &h))) {
            currentWidth = w;
            currentHeight = h;
        }
        pCurrentType->Release();
    }

    isCapturing = true;
    captureThread = std::thread(&CameraManager::captureLoop, this);
    return true;
}

void CameraManager::stopCapture() {
    std::lock_guard<std::mutex> lock(captureMutex);
    isCapturing = false;
    if (captureThread.joinable()) {
        captureThread.join();
    }
    if (sourceReader) {
        sourceReader->Release();
        sourceReader = nullptr;
    }
}

void CameraManager::captureLoop() {
    DWORD streamIndex, flags;
    LONGLONG llTimeStamp;
    IMFSample* pSample = nullptr;

    while (isCapturing) {
        HRESULT hr = sourceReader->ReadSample(
            (DWORD)MF_SOURCE_READER_FIRST_VIDEO_STREAM,
            0,
            &streamIndex,
            &flags,
            &llTimeStamp,
            &pSample
        );

        if (FAILED(hr)) {
            // Disconnect or error
            break;
        }

        if (flags & MF_SOURCE_READERF_ERROR) break;
        if (flags & MF_SOURCE_READERF_ENDOFSTREAM) break;

        if (pSample) {
            IMFMediaBuffer* pBuffer = nullptr;
            hr = pSample->ConvertToContiguousBuffer(&pBuffer);
            if (SUCCEEDED(hr)) {
                BYTE* pData = nullptr;
                DWORD cbMaxLength = 0;
                DWORD cbCurrentLength = 0;
                
                hr = pBuffer->Lock(&pData, &cbMaxLength, &cbCurrentLength);
                if (SUCCEEDED(hr)) {
                    // Fire callback (N-API expects RGB/RGBA buffer)
                    // Note: MFVideoFormat_RGB32 is BGRA in memory. The UI will swap B and R if needed.
                    if (onFrame) {
                        onFrame(pData, cbCurrentLength, currentWidth, currentHeight);
                    }
                    pBuffer->Unlock();
                }
                pBuffer->Release();
            }
            pSample->Release();
        }
    }
}
