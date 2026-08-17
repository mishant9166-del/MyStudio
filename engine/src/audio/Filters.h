#pragma once
#include <vector>

namespace vs_engine {
namespace audio {

class GainFilter {
public:
    void setGainDb(float db);
    void process(float* data, size_t frames, int channels);
private:
    float m_linearGain = 1.0f;
};

class NoiseGate {
public:
    void setThresholdDb(float db);
    void process(float* data, size_t frames, int channels);
private:
    float m_threshold = 0.001f;
};

class Compressor {
public:
    void setThresholdDb(float db);
    void setRatio(float ratio);
    void process(float* data, size_t frames, int channels);
private:
    float m_thresholdDb = -20.0f;
    float m_ratio = 2.0f;
};

} // namespace audio
} // namespace vs_engine
