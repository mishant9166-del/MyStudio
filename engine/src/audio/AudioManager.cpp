#include "AudioManager.h"
#include <windows.h>
#include <mmdeviceapi.h>
#include <Functiondiscoverykeys_devpkey.h>
#include <iostream>

namespace vs_engine {
namespace audio {

AudioManager::AudioManager() {
    CoInitializeEx(nullptr, COINIT_MULTITHREADED);
}

AudioManager::~AudioManager() {
    CoUninitialize();
}

std::vector<AudioDevice> AudioManager::getInputs() {
    return enumerateDevices(true);
}

std::vector<AudioDevice> AudioManager::getOutputs() {
    return enumerateDevices(false);
}

std::string wstringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

std::vector<AudioDevice> AudioManager::enumerateDevices(bool isInput) {
    std::vector<AudioDevice> devices;
    IMMDeviceEnumerator* pEnumerator = nullptr;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) return devices;

    IMMDeviceCollection* pCollection = nullptr;
    hr = pEnumerator->EnumAudioEndpoints(isInput ? eCapture : eRender, DEVICE_STATE_ACTIVE, &pCollection);
    if (FAILED(hr)) {
        pEnumerator->Release();
        return devices;
    }

    IMMDevice* pDefaultDevice = nullptr;
    hr = pEnumerator->GetDefaultAudioEndpoint(isInput ? eCapture : eRender, eConsole, &pDefaultDevice);
    std::string defaultId = "";
    if (SUCCEEDED(hr) && pDefaultDevice) {
        LPWSTR pwszID = nullptr;
        if (SUCCEEDED(pDefaultDevice->GetId(&pwszID))) {
            defaultId = wstringToString(pwszID);
            CoTaskMemFree(pwszID);
        }
        pDefaultDevice->Release();
    }

    UINT count = 0;
    pCollection->GetCount(&count);
    for (UINT i = 0; i < count; i++) {
        IMMDevice* pEndpoint = nullptr;
        hr = pCollection->Item(i, &pEndpoint);
        if (FAILED(hr)) continue;

        LPWSTR pwszID = nullptr;
        hr = pEndpoint->GetId(&pwszID);
        if (FAILED(hr)) {
            pEndpoint->Release();
            continue;
        }
        std::string id = wstringToString(pwszID);
        CoTaskMemFree(pwszID);

        IPropertyStore* pProps = nullptr;
        hr = pEndpoint->OpenPropertyStore(STGM_READ, &pProps);
        std::string name = "Unknown Device";
        if (SUCCEEDED(hr)) {
            PROPVARIANT varName;
            PropVariantInit(&varName);
            hr = pProps->GetValue(PKEY_Device_FriendlyName, &varName);
            if (SUCCEEDED(hr) && varName.vt == VT_LPWSTR) {
                name = wstringToString(varName.pwszVal);
            }
            PropVariantClear(&varName);
            pProps->Release();
        }

        devices.push_back({id, name, id == defaultId, isInput});
        pEndpoint->Release();
    }

    pCollection->Release();
    pEnumerator->Release();
    return devices;
}

} // namespace audio
} // namespace vs_engine
