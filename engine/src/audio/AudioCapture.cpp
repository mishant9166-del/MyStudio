#include "AudioCapture.h"
#include <iostream>

#define REFTIMES_PER_SEC  10000000
#define REFTIMES_PER_MILLISEC  10000

namespace vs_engine {
namespace audio {

AudioCapture::AudioCapture() 
    : isRunning(false), pDevice(nullptr), pAudioClient(nullptr), pCaptureClient(nullptr), pFormat(nullptr) {
}

AudioCapture::~AudioCapture() {
    stop();
}

std::wstring stringToWString(const std::string& str) {
    if (str.empty()) return std::wstring();
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

bool AudioCapture::start(const std::string& deviceId, bool isLoopback, AudioCallback callback) {
    if (isRunning) return false;
    this->deviceId = deviceId;
    this->isLoopback = isLoopback;
    this->m_callback = callback;
    
    HRESULT hr;
    IMMDeviceEnumerator* pEnumerator = nullptr;
    hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) return false;

    if (deviceId.empty()) {
        hr = pEnumerator->GetDefaultAudioEndpoint(isLoopback ? eRender : eCapture, eConsole, &pDevice);
    } else {
        std::wstring wstrId = stringToWString(deviceId);
        hr = pEnumerator->GetDevice(wstrId.c_str(), &pDevice);
    }
    pEnumerator->Release();
    if (FAILED(hr)) return false;

    hr = pDevice->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, (void**)&pAudioClient);
    if (FAILED(hr)) { pDevice->Release(); pDevice = nullptr; return false; }

    hr = pAudioClient->GetMixFormat(&pFormat);
    if (FAILED(hr)) return false;

    // We can try to initialize directly with mix format (it will be float32, possibly varying sample rate/channels)
    DWORD streamFlags = isLoopback ? AUDCLNT_STREAMFLAGS_LOOPBACK : 0;
    hr = pAudioClient->Initialize(AUDCLNT_SHAREMODE_SHARED, streamFlags, REFTIMES_PER_SEC, 0, pFormat, nullptr);
    if (FAILED(hr)) return false;

    hr = pAudioClient->GetService(__uuidof(IAudioCaptureClient), (void**)&pCaptureClient);
    if (FAILED(hr)) return false;

    hr = pAudioClient->Start();
    if (FAILED(hr)) return false;

    isRunning = true;
    m_thread = std::thread(&AudioCapture::captureThread, this);
    return true;
}

void AudioCapture::stop() {
    if (!isRunning) return;
    isRunning = false;
    if (m_thread.joinable()) {
        m_thread.join();
    }
    
    if (pAudioClient) {
        pAudioClient->Stop();
    }
    
    if (pCaptureClient) { pCaptureClient->Release(); pCaptureClient = nullptr; }
    if (pFormat) { CoTaskMemFree(pFormat); pFormat = nullptr; }
    if (pAudioClient) { pAudioClient->Release(); pAudioClient = nullptr; }
    if (pDevice) { pDevice->Release(); pDevice = nullptr; }
}

void AudioCapture::captureThread() {
    CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    
    UINT32 packetLength = 0;
    while (isRunning) {
        Sleep(10);
        
        HRESULT hr = pCaptureClient->GetNextPacketSize(&packetLength);
        if (FAILED(hr)) continue;
        
        while (packetLength != 0) {
            BYTE* pData;
            UINT32 numFramesAvailable;
            DWORD flags;
            
            hr = pCaptureClient->GetBuffer(&pData, &numFramesAvailable, &flags, nullptr, nullptr);
            if (FAILED(hr)) break;
            
            if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
                // Ignore silent buffers or pass zeros
            } else {
                if (m_callback && pFormat->wFormatTag == WAVE_FORMAT_EXTENSIBLE) {
                    WAVEFORMATEXTENSIBLE* pEx = (WAVEFORMATEXTENSIBLE*)pFormat;
                    if (pEx->SubFormat == KSDATAFORMAT_SUBTYPE_IEEE_FLOAT) {
                        float* pFloatData = (float*)pData;
                        m_callback(pFloatData, numFramesAvailable, pFormat->nChannels, pFormat->nSamplesPerSec);
                    }
                }
            }
            
            hr = pCaptureClient->ReleaseBuffer(numFramesAvailable);
            if (FAILED(hr)) break;
            
            hr = pCaptureClient->GetNextPacketSize(&packetLength);
            if (FAILED(hr)) break;
        }
    }
    CoUninitialize();
}

} // namespace audio
} // namespace vs_engine
