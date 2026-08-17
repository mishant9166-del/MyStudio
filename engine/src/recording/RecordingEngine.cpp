#include "RecordingEngine.h"
#include <mferror.h>
#include <iostream>

#pragma comment(lib, "mfreadwrite.lib")
#pragma comment(lib, "mfplat.lib")
#pragma comment(lib, "mfuuid.lib")

namespace vs_engine {
namespace recording {

template <class T> void SafeRelease(T** ppT) {
    if (*ppT) {
        (*ppT)->Release();
        *ppT = NULL;
    }
}

RecordingEngine::RecordingEngine() {
    MFStartup(MF_VERSION);
}

RecordingEngine::~RecordingEngine() {
    stopRecording();
    MFShutdown();
}

bool RecordingEngine::startRecording(const std::string& path, const RecordingSettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_isRecording) return false;

    m_settings = settings;
    m_firstVideoTimestamp = -1;
    m_firstAudioTimestamp = -1;

    HRESULT hr = S_OK;
    IMFAttributes* pAttributes = NULL;
    IMFMediaType* pVideoOutMediaType = NULL;
    IMFMediaType* pVideoInMediaType = NULL;
    IMFMediaType* pAudioOutMediaType = NULL;
    IMFMediaType* pAudioInMediaType = NULL;

    std::wstring wPath(path.begin(), path.end());

    hr = MFCreateAttributes(&pAttributes, 1);
    if (SUCCEEDED(hr)) {
        hr = pAttributes->SetUINT32(MF_READWRITE_ENABLE_HARDWARE_TRANSFORMS, TRUE);
    }

    if (SUCCEEDED(hr)) {
        hr = MFCreateSinkWriterFromURL(wPath.c_str(), NULL, pAttributes, &m_sinkWriter);
    }

    // Set up Video output type
    if (SUCCEEDED(hr)) {
        hr = MFCreateMediaType(&pVideoOutMediaType);
    }
    if (SUCCEEDED(hr)) {
        pVideoOutMediaType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pVideoOutMediaType->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_H264);
        pVideoOutMediaType->SetUINT32(MF_MT_AVG_BITRATE, m_settings.videoBitrate);
        pVideoOutMediaType->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        MFSetAttributeSize(pVideoOutMediaType, MF_MT_FRAME_SIZE, m_settings.videoWidth, m_settings.videoHeight);
        MFSetAttributeRatio(pVideoOutMediaType, MF_MT_FRAME_RATE, m_settings.videoFps, 1);
        MFSetAttributeRatio(pVideoOutMediaType, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        hr = m_sinkWriter->AddStream(pVideoOutMediaType, &m_videoStreamIndex);
    }

    // Set up Video input type
    if (SUCCEEDED(hr)) {
        hr = MFCreateMediaType(&pVideoInMediaType);
    }
    if (SUCCEEDED(hr)) {
        pVideoInMediaType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pVideoInMediaType->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_ARGB32);
        pVideoInMediaType->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        MFSetAttributeSize(pVideoInMediaType, MF_MT_FRAME_SIZE, m_settings.videoWidth, m_settings.videoHeight);
        MFSetAttributeRatio(pVideoInMediaType, MF_MT_FRAME_RATE, m_settings.videoFps, 1);
        MFSetAttributeRatio(pVideoInMediaType, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        hr = m_sinkWriter->SetInputMediaType(m_videoStreamIndex, pVideoInMediaType, NULL);
    }

    // Set up Audio output type
    if (SUCCEEDED(hr)) {
        hr = MFCreateMediaType(&pAudioOutMediaType);
    }
    if (SUCCEEDED(hr)) {
        pAudioOutMediaType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Audio);
        pAudioOutMediaType->SetGUID(MF_MT_SUBTYPE, MFAudioFormat_AAC);
        pAudioOutMediaType->SetUINT32(MF_MT_AUDIO_BITS_PER_SAMPLE, 16);
        pAudioOutMediaType->SetUINT32(MF_MT_AUDIO_SAMPLES_PER_SECOND, m_settings.audioSampleRate);
        pAudioOutMediaType->SetUINT32(MF_MT_AUDIO_NUM_CHANNELS, m_settings.audioChannels);
        pAudioOutMediaType->SetUINT32(MF_MT_AUDIO_AVG_BYTES_PER_SECOND, m_settings.audioBitrate / 8);
        hr = m_sinkWriter->AddStream(pAudioOutMediaType, &m_audioStreamIndex);
    }

    // Set up Audio input type
    if (SUCCEEDED(hr)) {
        hr = MFCreateMediaType(&pAudioInMediaType);
    }
    if (SUCCEEDED(hr)) {
        pAudioInMediaType->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Audio);
        pAudioInMediaType->SetGUID(MF_MT_SUBTYPE, MFAudioFormat_Float);
        pAudioInMediaType->SetUINT32(MF_MT_AUDIO_BITS_PER_SAMPLE, 32);
        pAudioInMediaType->SetUINT32(MF_MT_AUDIO_SAMPLES_PER_SECOND, m_settings.audioSampleRate);
        pAudioInMediaType->SetUINT32(MF_MT_AUDIO_NUM_CHANNELS, m_settings.audioChannels);
        pAudioInMediaType->SetUINT32(MF_MT_AUDIO_BLOCK_ALIGNMENT, m_settings.audioChannels * 4);
        pAudioInMediaType->SetUINT32(MF_MT_AUDIO_AVG_BYTES_PER_SECOND, m_settings.audioSampleRate * m_settings.audioChannels * 4);
        hr = m_sinkWriter->SetInputMediaType(m_audioStreamIndex, pAudioInMediaType, NULL);
    }

    if (SUCCEEDED(hr)) {
        hr = m_sinkWriter->BeginWriting();
    }

    SafeRelease(&pAttributes);
    SafeRelease(&pVideoOutMediaType);
    SafeRelease(&pVideoInMediaType);
    SafeRelease(&pAudioOutMediaType);
    SafeRelease(&pAudioInMediaType);

    if (FAILED(hr)) {
        SafeRelease(&m_sinkWriter);
        return false;
    }

    m_isRecording = true;
    return true;
}

void RecordingEngine::stopRecording() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!m_isRecording) return;

    if (m_sinkWriter) {
        m_sinkWriter->Finalize();
        SafeRelease(&m_sinkWriter);
    }
    m_isRecording = false;
}

void RecordingEngine::pushVideoFrame(const uint8_t* buffer, LONGLONG timestamp) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!m_isRecording || !m_sinkWriter) return;

    if (m_firstVideoTimestamp == -1) m_firstVideoTimestamp = timestamp;
    LONGLONG rtStart = timestamp - m_firstVideoTimestamp;

    const LONG cbWidth = 4 * m_settings.videoWidth;
    const DWORD cbBuffer = cbWidth * m_settings.videoHeight;
    
    IMFSample* pSample = NULL;
    IMFMediaBuffer* pBuffer = NULL;

    HRESULT hr = MFCreateMemoryBuffer(cbBuffer, &pBuffer);
    if (SUCCEEDED(hr)) {
        BYTE* pData = NULL;
        hr = pBuffer->Lock(&pData, NULL, NULL);
        if (SUCCEEDED(hr)) {
            // MF ARGB32 expects bottom-up if not specified, but let's assume top-down since it's progressive and we can correct it if needed.
            // Actually MFVideoFormat_ARGB32 is bottom-up. But for simplicity, we just copy. If it's inverted we could flip it.
            // We can specify stride via MF_MT_DEFAULT_STRIDE. Without it, let's just copy directly.
            for (int y = 0; y < m_settings.videoHeight; y++) {
                // Invert y to match MF default bottom up DIB orientation or just direct copy
                memcpy(pData + (m_settings.videoHeight - 1 - y) * cbWidth, buffer + y * cbWidth, cbWidth);
            }
            pBuffer->Unlock();
        }
        hr = pBuffer->SetCurrentLength(cbBuffer);
    }
    if (SUCCEEDED(hr)) {
        hr = MFCreateSample(&pSample);
    }
    if (SUCCEEDED(hr)) {
        hr = pSample->AddBuffer(pBuffer);
    }
    if (SUCCEEDED(hr)) {
        hr = pSample->SetSampleTime(rtStart);
        hr = pSample->SetSampleDuration(10000000 / m_settings.videoFps);
    }
    if (SUCCEEDED(hr)) {
        hr = m_sinkWriter->WriteSample(m_videoStreamIndex, pSample);
    }

    SafeRelease(&pSample);
    SafeRelease(&pBuffer);
}

void RecordingEngine::pushAudioBuffer(const float* buffer, size_t frames, LONGLONG timestamp) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!m_isRecording || !m_sinkWriter) return;

    if (m_firstAudioTimestamp == -1) m_firstAudioTimestamp = timestamp;
    LONGLONG rtStart = timestamp - m_firstAudioTimestamp;

    DWORD cbBuffer = (DWORD)(frames * m_settings.audioChannels * sizeof(float));

    IMFSample* pSample = NULL;
    IMFMediaBuffer* pBuffer = NULL;

    HRESULT hr = MFCreateMemoryBuffer(cbBuffer, &pBuffer);
    if (SUCCEEDED(hr)) {
        BYTE* pData = NULL;
        hr = pBuffer->Lock(&pData, NULL, NULL);
        if (SUCCEEDED(hr)) {
            memcpy(pData, buffer, cbBuffer);
            pBuffer->Unlock();
        }
        hr = pBuffer->SetCurrentLength(cbBuffer);
    }
    if (SUCCEEDED(hr)) {
        hr = MFCreateSample(&pSample);
    }
    if (SUCCEEDED(hr)) {
        hr = pSample->AddBuffer(pBuffer);
    }
    if (SUCCEEDED(hr)) {
        hr = pSample->SetSampleTime(rtStart);
        LONGLONG duration = (LONGLONG)frames * 10000000 / m_settings.audioSampleRate;
        hr = pSample->SetSampleDuration(duration);
    }
    if (SUCCEEDED(hr)) {
        hr = m_sinkWriter->WriteSample(m_audioStreamIndex, pSample);
    }

    SafeRelease(&pSample);
    SafeRelease(&pBuffer);
}

} // namespace recording
} // namespace vs_engine
