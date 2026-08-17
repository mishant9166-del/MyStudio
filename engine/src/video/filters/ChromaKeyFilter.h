#pragma once
#include "IVideoFilter.h"

namespace vs_engine {
namespace video {
namespace filters {

class ChromaKeyFilter : public IVideoFilter {
public:
    ChromaKeyFilter(int r, int g, int b, float tolerance, float spillReduction);
    void apply(uint8_t* bgraBuffer, int width, int height) override;
    std::string getId() const override { return "chroma"; }

private:
    int m_targetR, m_targetG, m_targetB;
    float m_tolerance;
    float m_spillReduction;
};

}
}
}
