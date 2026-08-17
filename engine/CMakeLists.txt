cmake_minimum_required(VERSION 3.15)
project(VideoStudioEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Definitions for Windows Media Foundation and DXGI
if(WIN32)
    add_definitions(-DWIN32_LEAN_AND_MEAN)
    add_definitions(-DNOMINMAX)
endif()

# Include directories
include_directories(
    ${CMAKE_JS_INC}
    ${CMAKE_SOURCE_DIR}/node_modules/node-addon-api
    include
)

# N-API Addon Target
set(SOURCE_FILES 
    ${CMAKE_JS_SRC}
    src/api/napi_module.cpp
    src/capture/CameraManager.cpp
    src/capture/ScreenCaptureManager.cpp
    src/audio/AudioManager.cpp
    src/audio/AudioCapture.cpp
    src/audio/AudioMixer.cpp
    src/audio/Filters.cpp
    src/video/NativeCompositor.cpp
    src/video/filters/ColorFilter.cpp
    src/video/filters/ChromaKeyFilter.cpp
    src/video/filters/BlurFilter.cpp
    src/recording/RecordingEngine.cpp
    src/streaming/StreamingEngine.cpp
    src/virtual_camera/VirtualCameraEngine.cpp
)
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# Configure output extension to .node
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# Link against Node.js libraries and Windows Media APIs
target_link_libraries(${PROJECT_NAME} PRIVATE
    ${CMAKE_JS_LIB}
    mf.lib
    mfplat.lib
    mfuuid.lib
    mfreadwrite.lib
    d3d11.lib
    dxgi.lib
    Mmdevapi.lib
    ole32.lib
    Avrt.lib
)

# Suppress some C++ exception warnings when using N-API
target_compile_definitions(${PROJECT_NAME} PRIVATE NAPI_DISABLE_CPP_EXCEPTIONS)

# Virtual Camera DLL
set(VIRTUAL_CAMERA_SOURCES
    src/virtual_camera/DllMain.cpp
    src/virtual_camera/VirtualCameraFilter.cpp
    src/virtual_camera/VirtualCameraPin.cpp
    src/virtual_camera/VirtualCamera.def
)

add_library(VideoStudioCam SHARED ${VIRTUAL_CAMERA_SOURCES})

target_link_libraries(VideoStudioCam PRIVATE
    strmiids.lib
    uuid.lib
    ole32.lib
    oleaut32.lib
)
