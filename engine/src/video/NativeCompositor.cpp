#include "NativeCompositor.h"
#include "../virtual_camera/VirtualCameraEngine.h"
#include <chrono>
#include <algorithm>

namespace vs_engine {
namespace video {

NativeCompositor::NativeCompositor() : m_running(true) {
    m_canvas.resize(1920 * 1080 * 4, 0); // 1080p BGRA
    auto now = std::chrono::steady_clock::now();
    m_startTime = std::chrono::duration_cast<std::chrono::nanoseconds>(now.time_since_epoch()).count() / 100;
    
    m_renderThread = std::thread(&NativeCompositor::renderLoop, this);
}

NativeCompositor::~NativeCompositor() {
    m_running = false;
    if (m_renderThread.joinable()) {
        m_renderThread.join();
    }
}

void NativeCompositor::updateLayout(const std::vector<SourceLayout>& layouts) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_layouts = layouts;
    // Sort layouts by zIndex
    std::sort(m_layouts.begin(), m_layouts.end(), [](const SourceLayout& a, const SourceLayout& b) {
        return a.zIndex < b.zIndex;
    });
}

void NativeCompositor::updateSourceFilters(const std::string& sourceId, std::vector<std::shared_ptr<filters::IVideoFilter>> filters) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_sourceFilters[sourceId] = filters;
}

void NativeCompositor::pushSourceFrame(const std::string& sourceId, const uint8_t* data, int width, int height) {
    std::lock_guard<std::mutex> lock(m_mutex);
    auto& frame = m_latestFrames[sourceId];
    frame.width = width;
    frame.height = height;
    size_t size = width * height * 4; // Assuming 4 bytes per pixel (BGRA)
    frame.data.assign(data, data + size);

    if (m_sourceFilters.count(sourceId)) {
        auto& filters = m_sourceFilters[sourceId];
        for (auto& filter : filters) {
            filter->apply(frame.data.data(), width, height);
        }
    }
}

void NativeCompositor::setRecordingEngine(std::shared_ptr<recording::RecordingEngine> engine) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_recordingEngine = engine;
}

void NativeCompositor::setStreamingEngine(std::shared_ptr<streaming::StreamingEngine> engine) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_streamingEngine = engine;
}

void NativeCompositor::renderLoop() {
    const int targetFps = 30;
    const int frameDurationMs = 1000 / targetFps;

    while (m_running) {
        auto startFrameTime = std::chrono::steady_clock::now();

        std::shared_ptr<recording::RecordingEngine> engine;
        std::shared_ptr<streaming::StreamingEngine> streamingEngine;
        {
            std::lock_guard<std::mutex> lock(m_mutex);
            engine = m_recordingEngine;
            streamingEngine = m_streamingEngine;
            
            // Clear canvas to black
            std::fill(m_canvas.begin(), m_canvas.end(), 0);

            // Simple compositor
            for (const auto& layout : m_layouts) {
                if (m_latestFrames.count(layout.id)) {
                    const auto& frame = m_latestFrames[layout.id];
                    if (frame.width == 0 || frame.height == 0) continue;

                    // Nearest-neighbor scaling & blending
                    float scaleX = (float)frame.width / layout.width;
                    float scaleY = (float)frame.height / layout.height;

                    for (int y = 0; y < layout.height; ++y) {
                        int destY = layout.y + y;
                        if (destY < 0 || destY >= 1080) continue;

                        int srcY = (int)(y * scaleY);
                        if (srcY >= frame.height) srcY = frame.height - 1;

                        for (int x = 0; x < layout.width; ++x) {
                            int destX = layout.x + x;
                            if (destX < 0 || destX >= 1920) continue;

                            int srcX = (int)(x * scaleX);
                            if (srcX >= frame.width) srcX = frame.width - 1;

                            int srcIdx = (srcY * frame.width + srcX) * 4;
                            int destIdx = (destY * 1920 + destX) * 4;

                            // Alpha blending (assuming pre-multiplied alpha or simple over)
                            uint8_t a = frame.data[srcIdx + 3];
                            if (a == 255) {
                                m_canvas[destIdx] = frame.data[srcIdx];
                                m_canvas[destIdx + 1] = frame.data[srcIdx + 1];
                                m_canvas[destIdx + 2] = frame.data[srcIdx + 2];
                                m_canvas[destIdx + 3] = 255;
                            } else if (a > 0) {
                                float alpha = a / 255.0f;
                                float invAlpha = 1.0f - alpha;
                                m_canvas[destIdx] = (uint8_t)(frame.data[srcIdx] * alpha + m_canvas[destIdx] * invAlpha);
                                m_canvas[destIdx + 1] = (uint8_t)(frame.data[srcIdx + 1] * alpha + m_canvas[destIdx + 1] * invAlpha);
                                m_canvas[destIdx + 2] = (uint8_t)(frame.data[srcIdx + 2] * alpha + m_canvas[destIdx + 2] * invAlpha);
                                m_canvas[destIdx + 3] = std::max((uint8_t)255, (uint8_t)(a + m_canvas[destIdx + 3]));
                            }
                        }
                    }
                }
            }
        }

        if (engine) {
            auto now = std::chrono::steady_clock::now();
            LONGLONG currentTimestamp = std::chrono::duration_cast<std::chrono::nanoseconds>(now.time_since_epoch()).count() / 100;
            engine->pushVideoFrame(m_canvas.data(), currentTimestamp);
        }

        if (streamingEngine) {
            streamingEngine->pushVideoFrame(m_canvas.data(), m_canvas.size());
        }

        // Push to Virtual Camera if running
        vs_engine::VirtualCameraEngine::getInstance().pushFrame(m_canvas.data(), m_canvas.size());

        auto endFrameTime = std::chrono::steady_clock::now();
        auto elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(endFrameTime - startFrameTime).count();
        if (elapsedMs < frameDurationMs) {
            std::this_thread::sleep_for(std::chrono::milliseconds(frameDurationMs - elapsedMs));
        }
    }
}

} // namespace video
} // namespace vs_engine
