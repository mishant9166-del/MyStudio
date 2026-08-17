#pragma once
#include <cstdint>
#include <string>

namespace vs_engine {
namespace video {
namespace filters {

class IVideoFilter {
public:
    virtual ~IVideoFilter() = default;
    virtual void apply(uint8_t* bgraBuffer, int width, int height) = 0;
    virtual std::string getId() const = 0;
};

} // namespace filters
} // namespace video
} // namespace vs_engine
