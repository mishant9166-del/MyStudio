#include "engine_core.h"
#include <iostream>
#include <cassert>

int main() {
    vs_engine::Core engine;
    std::string response = engine.ping();
    
    std::cout << "Test Ping Response: " << response << std::endl;
    assert(response == "pong_from_native_engine");
    
    std::cout << "Native C++ engine test runs successfully!" << std::endl;
    return 0;
}
