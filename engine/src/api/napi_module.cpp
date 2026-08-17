#include <napi.h>
#include "../include/CameraManager.h"
#include "../include/ScreenCaptureManager.h"
#include "../audio/AudioManager.h"
#include "../audio/AudioCapture.h"
#include "../audio/AudioMixer.h"
#include "../recording/RecordingEngine.h"
#include "../streaming/StreamingEngine.h"
#include "../virtual_camera/VirtualCameraEngine.h"
#include "../video/NativeCompositor.h"
#include "../video/filters/ColorFilter.h"
#include "../video/filters/ChromaKeyFilter.h"
#include "../video/filters/BlurFilter.h"
#include <iostream>
#include <memory>
#include <map>

using namespace vs_engine::capture;
using namespace vs_engine::audio;

std::unique_ptr<CameraManager> cameraManager;
std::unique_ptr<ScreenCaptureManager> screenManager;
std::unique_ptr<AudioManager> audioManager;
std::unique_ptr<AudioMixer> audioMixer;
std::shared_ptr<vs_engine::recording::RecordingEngine> recordingEngine;
std::shared_ptr<vs_engine::streaming::StreamingEngine> streamingEngine;
std::shared_ptr<vs_engine::video::NativeCompositor> nativeCompositor;
std::map<std::string, std::unique_ptr<AudioCapture>> audioCaptures;

Napi::ThreadSafeFunction cameraTsfn;
Napi::ThreadSafeFunction screenTsfn;
Napi::ThreadSafeFunction metersTsfn;

// --- Camera API ---
Napi::Value GetCameras(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!cameraManager) cameraManager = std::make_unique<CameraManager>();
    
    auto devices = cameraManager->getDevices();
    Napi::Array result = Napi::Array::New(env, devices.size());
    for (size_t i = 0; i < devices.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", devices[i].id);
        obj.Set("name", devices[i].name);
        result.Set(i, obj);
    }
    return result;
}

Napi::Value StartCamera(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Expected string (deviceId) and function (callback)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string deviceId = info[0].As<Napi::String>();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    if (!cameraManager) cameraManager = std::make_unique<CameraManager>();

    cameraTsfn = Napi::ThreadSafeFunction::New(
        env, callback, "CameraFrameCallback", 0, 1, [](Napi::Env) {}
    );

    auto frameCallback = [](const uint8_t* data, size_t size, int width, int height) {
        if (!cameraTsfn) return;
        
        // We must copy the buffer because N-API buffer takes ownership or we must ensure it stays alive.
        // For thread-safety across V8, allocating a new Buffer inside the Call is safest.
        struct FrameData {
            std::vector<uint8_t> buffer;
            int w, h;
        };
        auto* frame = new FrameData{ std::vector<uint8_t>(data, data + size), width, height };

        cameraTsfn.BlockingCall(frame, [](Napi::Env env, Napi::Function jsCallback, FrameData* f) {
            Napi::Buffer<uint8_t> nodeBuffer = Napi::Buffer<uint8_t>::Copy(env, f->buffer.data(), f->buffer.size());
            jsCallback.Call({ nodeBuffer, Napi::Number::New(env, f->w), Napi::Number::New(env, f->h) });
            delete f;
        });
    };

    auto frameCallbackWrapper = [deviceId, frameCallback](const uint8_t* data, size_t size, int width, int height) {
        if (nativeCompositor) {
            nativeCompositor->pushSourceFrame(deviceId, data, width, height);
        }
        frameCallback(data, size, width, height);
    };

    bool success = cameraManager->startCapture(deviceId, frameCallbackWrapper);
    return Napi::Boolean::New(env, success);
}

Napi::Value StopCamera(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (cameraManager) cameraManager->stopCapture();
    if (cameraTsfn) {
        cameraTsfn.Release();
        cameraTsfn = nullptr;
    }
    return env.Null();
}

// --- Screen API ---
Napi::Value GetDisplays(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!screenManager) screenManager = std::make_unique<ScreenCaptureManager>();
    
    auto devices = screenManager->getDisplays();
    Napi::Array result = Napi::Array::New(env, devices.size());
    for (size_t i = 0; i < devices.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", devices[i].id);
        obj.Set("name", devices[i].name);
        obj.Set("width", devices[i].width);
        obj.Set("height", devices[i].height);
        obj.Set("isPrimary", devices[i].isPrimary);
        result.Set(i, obj);
    }
    return result;
}

Napi::Value StartScreen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
        Napi::TypeError::New(env, "Expected string (displayId) and function (callback)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string displayId = info[0].As<Napi::String>();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    if (!screenManager) screenManager = std::make_unique<ScreenCaptureManager>();

    screenTsfn = Napi::ThreadSafeFunction::New(
        env, callback, "ScreenFrameCallback", 0, 1, [](Napi::Env) {}
    );

    auto frameCallback = [](const uint8_t* data, size_t size, int width, int height) {
        if (!screenTsfn) return;
        struct FrameData {
            std::vector<uint8_t> buffer;
            int w, h;
        };
        auto* frame = new FrameData{ std::vector<uint8_t>(data, data + size), width, height };

        screenTsfn.BlockingCall(frame, [](Napi::Env env, Napi::Function jsCallback, FrameData* f) {
            Napi::Buffer<uint8_t> nodeBuffer = Napi::Buffer<uint8_t>::Copy(env, f->buffer.data(), f->buffer.size());
            jsCallback.Call({ nodeBuffer, Napi::Number::New(env, f->w), Napi::Number::New(env, f->h) });
            delete f;
        });
    };

    auto frameCallbackWrapper = [displayId, frameCallback](const uint8_t* data, size_t size, int width, int height) {
        if (nativeCompositor) {
            nativeCompositor->pushSourceFrame(displayId, data, width, height);
        }
        frameCallback(data, size, width, height);
    };

    bool success = screenManager->startCapture(displayId, frameCallbackWrapper);
    return Napi::Boolean::New(env, success);
}

Napi::Value StopScreen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (screenManager) screenManager->stopCapture();
    if (screenTsfn) {
        screenTsfn.Release();
        screenTsfn = nullptr;
    }
    return env.Null();
}

// --- Audio API ---
Napi::Value GetAudioInputDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!audioManager) audioManager = std::make_unique<AudioManager>();
    
    auto devices = audioManager->getInputs();
    Napi::Array result = Napi::Array::New(env, devices.size());
    for (size_t i = 0; i < devices.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", devices[i].id);
        obj.Set("name", devices[i].name);
        obj.Set("isDefault", devices[i].isDefault);
        result.Set(i, obj);
    }
    return result;
}

Napi::Value GetAudioOutputDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!audioManager) audioManager = std::make_unique<AudioManager>();
    
    auto devices = audioManager->getOutputs();
    Napi::Array result = Napi::Array::New(env, devices.size());
    for (size_t i = 0; i < devices.size(); i++) {
        Napi::Object obj = Napi::Object::New(env);
        obj.Set("id", devices[i].id);
        obj.Set("name", devices[i].name);
        obj.Set("isDefault", devices[i].isDefault);
        result.Set(i, obj);
    }
    return result;
}

Napi::Value AddAudioSource(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsBoolean()) {
        Napi::TypeError::New(env, "Expected trackId, deviceId, isLoopback").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string trackId = info[0].As<Napi::String>();
    std::string deviceId = info[1].As<Napi::String>();
    bool isLoopback = info[2].As<Napi::Boolean>();
    
    if (!audioMixer) audioMixer = std::make_unique<AudioMixer>();
    audioMixer->addTrack(trackId);
    
    auto capture = std::make_unique<AudioCapture>();
    auto cb = [trackId](const float* data, size_t frames, int channels, int sampleRate) {
        if (audioMixer) {
            audioMixer->processInput(trackId, data, frames, channels, sampleRate);
        }
    };
    
    bool success = capture->start(deviceId, isLoopback, cb);
    if (success) {
        audioCaptures[trackId] = std::move(capture);
    } else {
        audioMixer->removeTrack(trackId);
    }
    
    return Napi::Boolean::New(env, success);
}

Napi::Value RemoveAudioSource(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected trackId").ThrowAsJavaScriptException();
        return env.Null();
    }
    std::string trackId = info[0].As<Napi::String>();
    if (audioCaptures.count(trackId)) {
        audioCaptures[trackId]->stop();
        audioCaptures.erase(trackId);
    }
    if (audioMixer) audioMixer->removeTrack(trackId);
    return env.Null();
}

Napi::Value SetAudioVolume(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2) return env.Null();
    std::string trackId = info[0].As<Napi::String>();
    float db = info[1].As<Napi::Number>().FloatValue();
    if (audioMixer) audioMixer->setVolume(trackId, db);
    return env.Null();
}

Napi::Value SetAudioMute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2) return env.Null();
    std::string trackId = info[0].As<Napi::String>();
    bool mute = info[1].As<Napi::Boolean>();
    if (audioMixer) audioMixer->setMute(trackId, mute);
    return env.Null();
}

Napi::Value SetAudioSolo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2) return env.Null();
    std::string trackId = info[0].As<Napi::String>();
    bool solo = info[1].As<Napi::Boolean>();
    if (audioMixer) audioMixer->setSolo(trackId, solo);
    return env.Null();
}

Napi::Value OnAudioMeters(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsFunction()) return env.Null();
    
    Napi::Function callback = info[0].As<Napi::Function>();
    metersTsfn = Napi::ThreadSafeFunction::New(env, callback, "AudioMetersCallback", 0, 1, [](Napi::Env) {});
    
    // We should ideally run a thread that periodically polls audioMixer for meters, or invoke it directly.
    // For simplicity, we create a basic thread that polls.
    std::thread([]() {
        while (true) {
            Sleep(50);
            if (!metersTsfn || !audioMixer) break;
            
            metersTsfn.BlockingCall([](Napi::Env env, Napi::Function jsCallback) {
                // Here we might need a way to get all meters.
                jsCallback.Call({ env.Undefined() });
            });
        }
    }).detach();
    
    return env.Null();
}

// --- Recording API ---
Napi::Value StartRecording(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string (path)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string path = info[0].As<Napi::String>();
    
    if (!recordingEngine) recordingEngine = std::make_shared<vs_engine::recording::RecordingEngine>();
    if (!nativeCompositor) nativeCompositor = std::make_shared<vs_engine::video::NativeCompositor>();
    if (!audioMixer) audioMixer = std::make_unique<AudioMixer>();
    
    nativeCompositor->setRecordingEngine(recordingEngine);
    audioMixer->setRecordingEngine(recordingEngine);
    
    vs_engine::recording::RecordingSettings settings;
    // We could parse settingsJson from info[1] if provided, but default for now
    
    bool success = recordingEngine->startRecording(path, settings);
    return Napi::Boolean::New(env, success);
}

Napi::Value StopRecording(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (recordingEngine) {
        recordingEngine->stopRecording();
    }
    return env.Null();
}

Napi::Value UpdateRecordingLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array of layouts").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Array arr = info[0].As<Napi::Array>();
    std::vector<vs_engine::video::SourceLayout> layouts;
    for (uint32_t i = 0; i < arr.Length(); i++) {
        Napi::Object obj = arr.Get(i).As<Napi::Object>();
        vs_engine::video::SourceLayout layout;
        layout.id = obj.Get("id").As<Napi::String>();
        layout.x = obj.Get("x").As<Napi::Number>().Int32Value();
        layout.y = obj.Get("y").As<Napi::Number>().Int32Value();
        layout.width = obj.Get("width").As<Napi::Number>().Int32Value();
        layout.height = obj.Get("height").As<Napi::Number>().Int32Value();
        layout.zIndex = obj.Get("zIndex").As<Napi::Number>().Int32Value();
        layouts.push_back(layout);
    }
    
    if (!nativeCompositor) nativeCompositor = std::make_shared<vs_engine::video::NativeCompositor>();
    nativeCompositor->updateLayout(layouts);
    
    return env.Null();
}

Napi::Value UpdateSourceFilters(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsArray()) {
        Napi::TypeError::New(env, "Expected string (sourceId) and array (filters)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string sourceId = info[0].As<Napi::String>();
    Napi::Array arr = info[1].As<Napi::Array>();
    std::vector<std::shared_ptr<vs_engine::video::filters::IVideoFilter>> filters;
    
    for (uint32_t i = 0; i < arr.Length(); i++) {
        Napi::Object obj = arr.Get(i).As<Napi::Object>();
        std::string type = obj.Get("type").As<Napi::String>();
        
        if (type == "color") {
            float brightness = obj.Has("brightness") ? obj.Get("brightness").As<Napi::Number>().FloatValue() : 0.0f;
            float contrast = obj.Has("contrast") ? obj.Get("contrast").As<Napi::Number>().FloatValue() : 1.0f;
            float saturation = obj.Has("saturation") ? obj.Get("saturation").As<Napi::Number>().FloatValue() : 1.0f;
            filters.push_back(std::make_shared<vs_engine::video::filters::ColorFilter>(brightness, contrast, saturation));
        } else if (type == "chroma") {
            int r = obj.Has("targetColorR") ? obj.Get("targetColorR").As<Napi::Number>().Int32Value() : 0;
            int g = obj.Has("targetColorG") ? obj.Get("targetColorG").As<Napi::Number>().Int32Value() : 255;
            int b = obj.Has("targetColorB") ? obj.Get("targetColorB").As<Napi::Number>().Int32Value() : 0;
            float tolerance = obj.Has("tolerance") ? obj.Get("tolerance").As<Napi::Number>().FloatValue() : 0.1f;
            float spillReduction = obj.Has("spillReduction") ? obj.Get("spillReduction").As<Napi::Number>().FloatValue() : 0.5f;
            filters.push_back(std::make_shared<vs_engine::video::filters::ChromaKeyFilter>(r, g, b, tolerance, spillReduction));
        } else if (type == "blur") {
            int amount = obj.Has("amount") ? obj.Get("amount").As<Napi::Number>().Int32Value() : 0;
            filters.push_back(std::make_shared<vs_engine::video::filters::BlurFilter>(amount));
        }
    }
    
    if (!nativeCompositor) nativeCompositor = std::make_shared<vs_engine::video::NativeCompositor>();
    nativeCompositor->updateSourceFilters(sourceId, filters);
    
    return env.Null();
}

// --- Streaming API ---
Napi::Value StartStreaming(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsObject()) {
        Napi::TypeError::New(env, "Expected string (ffmpegPath), string (rtmpUrl), object (settings)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string ffmpegPath = info[0].As<Napi::String>();
    std::string rtmpUrl = info[1].As<Napi::String>();
    Napi::Object settings = info[2].As<Napi::Object>();
    
    int videoBitrate = settings.Has("videoBitrate") ? settings.Get("videoBitrate").As<Napi::Number>().Int32Value() : 4000;
    int audioBitrate = settings.Has("audioBitrate") ? settings.Get("audioBitrate").As<Napi::Number>().Int32Value() : 128;
    int fps = settings.Has("fps") ? settings.Get("fps").As<Napi::Number>().Int32Value() : 30;
    
    if (!streamingEngine) streamingEngine = std::make_shared<vs_engine::streaming::StreamingEngine>();
    if (!nativeCompositor) nativeCompositor = std::make_shared<vs_engine::video::NativeCompositor>();
    if (!audioMixer) audioMixer = std::make_unique<AudioMixer>();
    
    nativeCompositor->setStreamingEngine(streamingEngine);
    audioMixer->setStreamingEngine(streamingEngine);
    
    bool success = streamingEngine->startStreaming(ffmpegPath, rtmpUrl, videoBitrate, audioBitrate, fps);
    return Napi::Boolean::New(env, success);
}

Napi::Value StopStreaming(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (streamingEngine) {
        streamingEngine->stopStreaming();
    }
    return env.Null();
}

Napi::Value StartVirtualCamera(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    bool success = vs_engine::VirtualCameraEngine::getInstance().start();
    return Napi::Boolean::New(env, success);
}

Napi::Value StopVirtualCamera(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    vs_engine::VirtualCameraEngine::getInstance().stop();
    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getCameras"), Napi::Function::New(env, GetCameras));
    exports.Set(Napi::String::New(env, "startCamera"), Napi::Function::New(env, StartCamera));
    exports.Set(Napi::String::New(env, "stopCamera"), Napi::Function::New(env, StopCamera));
    
    exports.Set(Napi::String::New(env, "getDisplays"), Napi::Function::New(env, GetDisplays));
    exports.Set(Napi::String::New(env, "startScreen"), Napi::Function::New(env, StartScreen));
    exports.Set(Napi::String::New(env, "stopScreen"), Napi::Function::New(env, StopScreen));
    
    exports.Set(Napi::String::New(env, "getAudioInputDevices"), Napi::Function::New(env, GetAudioInputDevices));
    exports.Set(Napi::String::New(env, "getAudioOutputDevices"), Napi::Function::New(env, GetAudioOutputDevices));
    exports.Set(Napi::String::New(env, "addAudioSource"), Napi::Function::New(env, AddAudioSource));
    exports.Set(Napi::String::New(env, "removeAudioSource"), Napi::Function::New(env, RemoveAudioSource));
    exports.Set(Napi::String::New(env, "setAudioVolume"), Napi::Function::New(env, SetAudioVolume));
    exports.Set(Napi::String::New(env, "setAudioMute"), Napi::Function::New(env, SetAudioMute));
    exports.Set(Napi::String::New(env, "setAudioSolo"), Napi::Function::New(env, SetAudioSolo));
    exports.Set(Napi::String::New(env, "onAudioMeters"), Napi::Function::New(env, OnAudioMeters));
    
    exports.Set(Napi::String::New(env, "startRecording"), Napi::Function::New(env, StartRecording));
    exports.Set(Napi::String::New(env, "stopRecording"), Napi::Function::New(env, StopRecording));
    exports.Set(Napi::String::New(env, "updateRecordingLayout"), Napi::Function::New(env, UpdateRecordingLayout));
    exports.Set(Napi::String::New(env, "updateSourceFilters"), Napi::Function::New(env, UpdateSourceFilters));
    
    exports.Set(Napi::String::New(env, "startStreaming"), Napi::Function::New(env, StartStreaming));
    exports.Set(Napi::String::New(env, "stopStreaming"), Napi::Function::New(env, StopStreaming));
    
    exports.Set(Napi::String::New(env, "startVirtualCamera"), Napi::Function::New(env, StartVirtualCamera));
    exports.Set(Napi::String::New(env, "stopVirtualCamera"), Napi::Function::New(env, StopVirtualCamera));
    
    return exports;
}

NODE_API_MODULE(VideoStudioEngine, Init)
