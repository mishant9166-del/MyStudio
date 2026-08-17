#pragma once
#include <string>
#include <vector>
#include <map>
#include <mutex>
#include <memory>
#include <thread>
#include <atomic>
#include "../recording/RecordingEngine.h"
#include "../recording/RecordingEngine.h"
#include "../streaming/StreamingEngine.h"
#include "filters/IVideoFilter.h"

namespace vs_engine {
namespace video {

struct SourceLayout {
    std::string id;
    int x, y, width, height;
    int zIndex;
};

class NativeCompositor {
public:
    NativeCompositor();
    ~NativeCompositor();

    void updateLayout(const std::vector<SourceLayout>& layouts);
    void updateSourceFilters(const std::string& sourceId, std::vector<std::shared_ptr<filters::IVideoFilter>> filters);
    void pushSourceFrame(const std::string& sourceId, const uint8_t* data, int width, int height);
    
    void setRecordingEngine(std::shared_ptr<recording::RecordingEngine> engine);
    void setStreamingEngine(std::shared_ptr<streaming::StreamingEngine> engine);

private:
    void renderLoop();

    std::mutex m_mutex;
    std::vector<SourceLayout> m_layouts;
    
    struct SourceFrame {
        std::vector<uint8_t> data;
        int width, height;
    };
    std::map<std::string, SourceFrame> m_latestFrames;
    std::map<std::string, std::vector<std::shared_ptr<filters::IVideoFilter>>> m_sourceFilters;
    
    std::vector<uint8_t> m_canvas; // 1920x1080 BGRA
    std::shared_ptr<recording::RecordingEngine> m_recordingEngine;
    std::shared_ptr<streaming::StreamingEngine> m_streamingEngine;
    
    std::thread m_renderThread;
    std::atomic<bool> m_running;
    LONGLONG m_startTime;
};

} // namespace video
} // namespace vs_engine
