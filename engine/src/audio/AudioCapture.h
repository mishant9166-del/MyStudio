#pragma once
#include <string>
#include <functional>
#include <vector>
#include <atomic>
#include <thread>
#include <windows.h>
#include <mmdeviceapi.h>
#include <Audioclient.h>

namespace vs_engine {
namespace audio {

class AudioCapture {
public:
    using AudioCallback = std::function<void(const float* data, size_t numFrames, int channels, int sampleRate)>;

    AudioCapture();
    ~AudioCapture();

    bool start(const std::string& deviceId, bool isLoopback, AudioCallback callback);
    void stop();

private:
    void captureThread();

    std::atomic<bool> isRunning;
    std::thread m_thread;
    std::string deviceId;
    bool isLoopback;
    AudioCallback m_callback;

    IMMDevice* pDevice;
    IAudioClient* pAudioClient;
    IAudioCaptureClient* pCaptureClient;
    WAVEFORMATEX* pFormat;
};

} // namespace audio
} // namespace vs_engine
