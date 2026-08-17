#include "Filters.h"
#include <cmath>

namespace vs_engine {
namespace audio {

void GainFilter::setGainDb(float db) {
    m_linearGain = std::pow(10.0f, db / 20.0f);
}

void GainFilter::process(float* data, size_t frames, int channels) {
    for (size_t i = 0; i < frames * channels; i++) {
        data[i] *= m_linearGain;
    }
}

void NoiseGate::setThresholdDb(float db) {
    m_threshold = std::pow(10.0f, db / 20.0f);
}

void NoiseGate::process(float* data, size_t frames, int channels) {
    for (size_t i = 0; i < frames * channels; i += channels) {
        float maxSample = 0.0f;
        for (int c = 0; c < channels; c++) {
            float absSample = std::abs(data[i + c]);
            if (absSample > maxSample) maxSample = absSample;
        }
        
        if (maxSample < m_threshold) {
            for (int c = 0; c < channels; c++) {
                data[i + c] = 0.0f;
            }
        }
    }
}

void Compressor::setThresholdDb(float db) {
    m_thresholdDb = db;
}

void Compressor::setRatio(float ratio) {
    m_ratio = ratio;
}

void Compressor::process(float* data, size_t frames, int channels) {
    // Basic hard-knee compressor for demonstration
    for (size_t i = 0; i < frames * channels; i++) {
        float sample = data[i];
        float absSample = std::abs(sample);
        if (absSample > 1e-6f) {
            float sampleDb = 20.0f * std::log10(absSample);
            if (sampleDb > m_thresholdDb) {
                float overshoot = sampleDb - m_thresholdDb;
                float compressedOvershoot = overshoot / m_ratio;
                float newDb = m_thresholdDb + compressedOvershoot;
                float newLinear = std::pow(10.0f, newDb / 20.0f);
                data[i] = (sample > 0.0f ? newLinear : -newLinear);
            }
        }
    }
}

} // namespace audio
} // namespace vs_engine
