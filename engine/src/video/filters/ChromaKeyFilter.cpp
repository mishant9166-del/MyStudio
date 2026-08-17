#include "ChromaKeyFilter.h"
#include <algorithm>
#include <execution>
#include <vector>
#include <cmath>

namespace vs_engine {
namespace video {
namespace filters {

ChromaKeyFilter::ChromaKeyFilter(int r, int g, int b, float tolerance, float spillReduction)
    : m_targetR(r), m_targetG(g), m_targetB(b), m_tolerance(tolerance), m_spillReduction(spillReduction) {}

void ChromaKeyFilter::apply(uint8_t* bgraBuffer, int width, int height) {
    std::vector<int> rows(height);
    for (int i = 0; i < height; ++i) rows[i] = i;

    float maxDist = m_tolerance * 442.0f; // sqrt(255^2 * 3) ~ 441.67

    std::for_each(std::execution::par, rows.begin(), rows.end(), [&](int y) {
        for (int x = 0; x < width; ++x) {
            int idx = (y * width + x) * 4;
            
            int b = bgraBuffer[idx];
            int g = bgraBuffer[idx + 1];
            int r = bgraBuffer[idx + 2];

            float dist = std::sqrt(std::pow(r - m_targetR, 2) + std::pow(g - m_targetG, 2) + std::pow(b - m_targetB, 2));

            if (dist < maxDist) {
                // Key out
                bgraBuffer[idx + 3] = 0;
            } else if (m_spillReduction > 0.0f) {
                // Simple spill reduction based on target color
                if (m_targetG > m_targetR && m_targetG > m_targetB) {
                    if (g > r && g > b) {
                        float reduction = m_spillReduction;
                        g = std::max({(int)r, (int)b, (int)(g * (1.0f - reduction))});
                        bgraBuffer[idx + 1] = g;
                    }
                }
            }
        }
    });
}

}
}
}
