#pragma once
#include <string>
#include <windows.h>
#include <thread>
#include <atomic>
#include <mutex>
#include <cstdint>

namespace vs_engine {
namespace streaming {

class StreamingEngine {
public:
    StreamingEngine();
    ~StreamingEngine();

    bool startStreaming(const std::string& ffmpegPath, const std::string& rtmpUrl, int videoBitrate, int audioBitrate, int fps);
    void stopStreaming();

    void pushVideoFrame(const uint8_t* buffer, size_t length);
    void pushAudioBuffer(const uint8_t* buffer, size_t length);

private:
    void videoConnectThread();
    void audioConnectThread();

    HANDLE m_hVideoPipe = INVALID_HANDLE_VALUE;
    HANDLE m_hAudioPipe = INVALID_HANDLE_VALUE;
    HANDLE m_hProcess = nullptr;
    HANDLE m_hThread = nullptr;

    std::atomic<bool> m_isStreaming = false;
    std::atomic<bool> m_videoConnected = false;
    std::atomic<bool> m_audioConnected = false;

    std::thread m_videoThread;
    std::thread m_audioThread;
    
    std::mutex m_videoMutex;
    std::mutex m_audioMutex;
};

} // namespace streaming
} // namespace vs_engine
