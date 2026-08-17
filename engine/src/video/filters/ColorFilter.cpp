#include "ColorFilter.h"
#include <algorithm>
#include <execution>
#include <vector>
#include <cmath>

namespace vs_engine {
namespace video {
namespace filters {

ColorFilter::ColorFilter(float brightness, float contrast, float saturation)
    : m_brightness(brightness), m_contrast(contrast), m_saturation(saturation) {}

void ColorFilter::apply(uint8_t* bgraBuffer, int width, int height) {
    std::vector<int> rows(height);
    for (int i = 0; i < height; ++i) rows[i] = i;

    float b = m_brightness;
    float c = m_contrast;
    float s = m_saturation;

    std::for_each(std::execution::par, rows.begin(), rows.end(), [&](int y) {
        for (int x = 0; x < width; ++x) {
            int idx = (y * width + x) * 4;
            
            float b_val = bgraBuffer[idx];
            float g_val = bgraBuffer[idx + 1];
            float r_val = bgraBuffer[idx + 2];

            // Apply contrast
            b_val = ((b_val / 255.0f - 0.5f) * c + 0.5f) * 255.0f;
            g_val = ((g_val / 255.0f - 0.5f) * c + 0.5f) * 255.0f;
            r_val = ((r_val / 255.0f - 0.5f) * c + 0.5f) * 255.0f;

            // Apply brightness
            b_val += b;
            g_val += b;
            r_val += b;

            // Apply saturation
            float luma = 0.299f * r_val + 0.587f * g_val + 0.114f * b_val;
            
            b_val = luma + s * (b_val - luma);
            g_val = luma + s * (g_val - luma);
            r_val = luma + s * (r_val - luma);

            bgraBuffer[idx] = std::clamp((int)b_val, 0, 255);
            bgraBuffer[idx + 1] = std::clamp((int)g_val, 0, 255);
            bgraBuffer[idx + 2] = std::clamp((int)r_val, 0, 255);
        }
    });
}

}
}
}
