#pragma once
#include <map>
#include <string>
#include <vector>
#include <mutex>
#include <memory>
#include "Filters.h"

namespace vs_engine {
namespace recording { class RecordingEngine; }
namespace streaming { class StreamingEngine; }
namespace audio {

struct TrackInfo {
    std::string id;
    float volumeDb = 0.0f;
    bool isMute = false;
    bool isSolo = false;
    float currentRms = 0.0f;
    float currentPeak = 0.0f;
    
    std::vector<float> buffer;
    
    // Filters
    GainFilter gain;
    NoiseGate gate;
    Compressor compressor;
};

class AudioMixer {
public:
    AudioMixer();
    ~AudioMixer();

    void addTrack(const std::string& trackId);
    void removeTrack(const std::string& trackId);
    
    void setVolume(const std::string& trackId, float db);
    void setMute(const std::string& trackId, bool mute);
    void setSolo(const std::string& trackId, bool solo);

    void processInput(const std::string& trackId, const float* data, size_t frames, int channels, int sampleRate);
    
    TrackInfo getTrackInfo(const std::string& trackId);

    void setRecordingEngine(std::shared_ptr<recording::RecordingEngine> engine);
    void setStreamingEngine(std::shared_ptr<streaming::StreamingEngine> engine);

private:
    std::map<std::string, std::shared_ptr<TrackInfo>> m_tracks;
    std::shared_ptr<recording::RecordingEngine> m_recordingEngine;
    std::shared_ptr<streaming::StreamingEngine> m_streamingEngine;
    std::mutex m_mutex;
    bool m_anySolo = false;

    void updateSoloState();
};

} // namespace audio
} // namespace vs_engine
