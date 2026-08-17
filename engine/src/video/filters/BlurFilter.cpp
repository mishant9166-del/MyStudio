#include "BlurFilter.h"
#include <algorithm>
#include <execution>
#include <vector>

namespace vs_engine {
namespace video {
namespace filters {

BlurFilter::BlurFilter(int amount) : m_amount(amount) {}

void BlurFilter::apply(uint8_t* bgraBuffer, int width, int height) {
    if (m_amount <= 0) return;

    std::vector<uint8_t> tempBuffer(width * height * 4);
    int k = m_amount;

    std::vector<int> rows(height);
    for (int i = 0; i < height; ++i) rows[i] = i;

    // Horizontal pass
    std::for_each(std::execution::par, rows.begin(), rows.end(), [&](int y) {
        for (int x = 0; x < width; ++x) {
            int sumB = 0, sumG = 0, sumR = 0, sumA = 0;
            int count = 0;

            for (int dx = -k; dx <= k; ++dx) {
                int nx = std::clamp(x + dx, 0, width - 1);
                int idx = (y * width + nx) * 4;
                sumB += bgraBuffer[idx];
                sumG += bgraBuffer[idx + 1];
                sumR += bgraBuffer[idx + 2];
                sumA += bgraBuffer[idx + 3];
                count++;
            }

            int outIdx = (y * width + x) * 4;
            tempBuffer[outIdx] = sumB / count;
            tempBuffer[outIdx + 1] = sumG / count;
            tempBuffer[outIdx + 2] = sumR / count;
            tempBuffer[outIdx + 3] = sumA / count;
        }
    });

    // Vertical pass
    std::vector<int> cols(width);
    for (int i = 0; i < width; ++i) cols[i] = i;

    std::for_each(std::execution::par, cols.begin(), cols.end(), [&](int x) {
        for (int y = 0; y < height; ++y) {
            int sumB = 0, sumG = 0, sumR = 0, sumA = 0;
            int count = 0;

            for (int dy = -k; dy <= k; ++dy) {
                int ny = std::clamp(y + dy, 0, height - 1);
                int idx = (ny * width + x) * 4;
                sumB += tempBuffer[idx];
                sumG += tempBuffer[idx + 1];
                sumR += tempBuffer[idx + 2];
                sumA += tempBuffer[idx + 3];
                count++;
            }

            int outIdx = (y * width + x) * 4;
            bgraBuffer[outIdx] = sumB / count;
            bgraBuffer[outIdx + 1] = sumG / count;
            bgraBuffer[outIdx + 2] = sumR / count;
            bgraBuffer[outIdx + 3] = sumA / count;
        }
    });
}

}
}
}
