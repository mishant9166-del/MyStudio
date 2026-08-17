#pragma once
#include <string>
#include <vector>
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>
#include <mutex>

namespace vs_engine {
namespace recording {

struct RecordingSettings {
    int videoWidth = 1920;
    int videoHeight = 1080;
    int videoFps = 30;
    int videoBitrate = 5000000;
    int audioSampleRate = 48000;
    int audioChannels = 2;
    int audioBitrate = 128000;
};

class RecordingEngine {
public:
    RecordingEngine();
    ~RecordingEngine();

    bool startRecording(const std::string& path, const RecordingSettings& settings);
    void stopRecording();

    void pushVideoFrame(const uint8_t* buffer, LONGLONG timestamp);
    void pushAudioBuffer(const float* buffer, size_t frames, LONGLONG timestamp);

private:
    IMFSinkWriter* m_sinkWriter = nullptr;
    DWORD m_videoStreamIndex = 0;
    DWORD m_audioStreamIndex = 0;
    bool m_isRecording = false;
    std::mutex m_mutex;
    
    RecordingSettings m_settings;
    LONGLONG m_firstVideoTimestamp = -1;
    LONGLONG m_firstAudioTimestamp = -1;
};

} // namespace recording
} // namespace vs_engine
