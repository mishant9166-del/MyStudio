#pragma once
#include <string>
#include <vector>

namespace vs_engine {
namespace audio {

struct AudioDevice {
    std::string id;
    std::string name;
    bool isDefault;
    bool isInput;
};

class AudioManager {
public:
    AudioManager();
    ~AudioManager();

    std::vector<AudioDevice> getInputs();
    std::vector<AudioDevice> getOutputs();

private:
    std::vector<AudioDevice> enumerateDevices(bool isInput);
};

} // namespace audio
} // namespace vs_engine
