#include "AudioMixer.h"
#include <cmath>
#include <chrono>
#include "../recording/RecordingEngine.h"
#include "../streaming/StreamingEngine.h"

namespace vs_engine {
namespace audio {

AudioMixer::AudioMixer() {}

AudioMixer::~AudioMixer() {}

void AudioMixer::addTrack(const std::string& trackId) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.find(trackId) == m_tracks.end()) {
        auto track = std::make_shared<TrackInfo>();
        track->id = trackId;
        m_tracks[trackId] = track;
    }
}

void AudioMixer::removeTrack(const std::string& trackId) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_tracks.erase(trackId);
    updateSoloState();
}

void AudioMixer::setVolume(const std::string& trackId, float db) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.count(trackId)) {
        m_tracks[trackId]->volumeDb = db;
        m_tracks[trackId]->gain.setGainDb(db);
    }
}

void AudioMixer::setMute(const std::string& trackId, bool mute) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.count(trackId)) {
        m_tracks[trackId]->isMute = mute;
    }
}

void AudioMixer::setSolo(const std::string& trackId, bool solo) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.count(trackId)) {
        m_tracks[trackId]->isSolo = solo;
        updateSoloState();
    }
}

void AudioMixer::updateSoloState() {
    m_anySolo = false;
    for (auto& pair : m_tracks) {
        if (pair.second->isSolo) {
            m_anySolo = true;
            break;
        }
    }
}

void AudioMixer::processInput(const std::string& trackId, const float* data, size_t frames, int channels, int sampleRate) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.find(trackId) == m_tracks.end()) return;
    
    auto track = m_tracks[trackId];
    
    // Copy data to process
    std::vector<float> processed(data, data + (frames * channels));
    
    // Filters
    track->gate.process(processed.data(), frames, channels);
    track->compressor.process(processed.data(), frames, channels);
    track->gain.process(processed.data(), frames, channels);
    
    // Check mute / solo
    bool audible = true;
    if (track->isMute) audible = false;
    if (m_anySolo && !track->isSolo) audible = false;
    
    if (!audible) {
        std::fill(processed.begin(), processed.end(), 0.0f);
    }
    
    // Calculate meters
    float sumSq = 0.0f;
    float peak = 0.0f;
    for (size_t i = 0; i < processed.size(); i++) {
        float s = processed[i];
        sumSq += s * s;
        float absS = std::abs(s);
        if (absS > peak) peak = absS;
    }
    
    float rms = std::sqrt(sumSq / processed.size());
    track->currentRms = (rms > 0.0f) ? 20.0f * std::log10(rms) : -100.0f;
    track->currentPeak = (peak > 0.0f) ? 20.0f * std::log10(peak) : -100.0f;

    if (m_recordingEngine) {
        auto now = std::chrono::steady_clock::now();
        LONGLONG currentTimestamp = std::chrono::duration_cast<std::chrono::nanoseconds>(now.time_since_epoch()).count() / 100;
        m_recordingEngine->pushAudioBuffer(processed.data(), frames, currentTimestamp);
    }
    
    if (m_streamingEngine) {
        m_streamingEngine->pushAudioBuffer(reinterpret_cast<const uint8_t*>(processed.data()), frames * channels * sizeof(float));
    }
}

TrackInfo AudioMixer::getTrackInfo(const std::string& trackId) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_tracks.count(trackId)) {
        return *m_tracks[trackId];
    }
    return TrackInfo();
}

void AudioMixer::setRecordingEngine(std::shared_ptr<recording::RecordingEngine> engine) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_recordingEngine = engine;
}

void AudioMixer::setStreamingEngine(std::shared_ptr<streaming::StreamingEngine> engine) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_streamingEngine = engine;
}

} // namespace audio
} // namespace vs_engine
