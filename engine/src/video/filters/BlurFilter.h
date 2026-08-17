#pragma once
#include "IVideoFilter.h"

namespace vs_engine {
namespace video {
namespace filters {

class BlurFilter : public IVideoFilter {
public:
    BlurFilter(int amount);
    void apply(uint8_t* bgraBuffer, int width, int height) override;
    std::string getId() const override { return "blur"; }

private:
    int m_amount;
};

}
}
}
