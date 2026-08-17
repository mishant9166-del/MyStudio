#include "engine_core.h"
#include <iostream>

namespace vs_engine {
    Core::Core() {
        std::cout << "Engine Core Initialized" << std::endl;
    }
    
    Core::~Core() {}

    std::string Core::ping() {
        return "pong_from_native_engine";
    }
}
