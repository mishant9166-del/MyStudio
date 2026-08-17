#pragma once
#include "IVideoFilter.h"

namespace vs_engine {
namespace video {
namespace filters {

class ColorFilter : public IVideoFilter {
public:
    ColorFilter(float brightness, float contrast, float saturation);
    void apply(uint8_t* bgraBuffer, int width, int height) override;
    std::string getId() const override { return "color"; }

private:
    float m_brightness;
    float m_contrast;
    float m_saturation;
};

} // namespace filters
} // namespace video
} // namespace vs_engine
