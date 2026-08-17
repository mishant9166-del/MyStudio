#pragma once
#include <string>

#ifdef _WIN32
  #define ENGINE_API __declspec(dllexport)
#else
  #define ENGINE_API
#endif

namespace vs_engine {
    class ENGINE_API Core {
    public:
        Core();
        ~Core();
        std::string ping();
    };
}
