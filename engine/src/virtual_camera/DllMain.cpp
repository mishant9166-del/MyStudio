#include <windows.h>
#include <initguid.h>
#include <dshow.h>
#include "VirtualCamera.h"

long g_cComObjectCount = 0;
long g_cComLockCount = 0;
HINSTANCE g_hInstance = NULL;

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved)
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
        g_hInstance = hModule;
        DisableThreadLibraryCalls(hModule);
        break;
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

class CClassFactory : public IClassFactory
{
public:
    CClassFactory() : m_refCount(1) { InterlockedIncrement(&g_cComObjectCount); }
    virtual ~CClassFactory() { InterlockedDecrement(&g_cComObjectCount); }
    
    // IUnknown
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IClassFactory)
        {
            *ppv = static_cast<IClassFactory*>(this);
            AddRef();
            return S_OK;
        }
        *ppv = NULL;
        return E_NOINTERFACE;
    }

    STDMETHODIMP_(ULONG) AddRef() override
    {
        return InterlockedIncrement(&m_refCount);
    }

    STDMETHODIMP_(ULONG) Release() override
    {
        ULONG count = InterlockedDecrement(&m_refCount);
        if (count == 0) delete this;
        return count;
    }

    // IClassFactory
    STDMETHODIMP CreateInstance(IUnknown* pUnkOuter, REFIID riid, void** ppv) override
    {
        if (pUnkOuter != NULL) return CLASS_E_NOAGGREGATION;
        
        CVirtualCameraFilter* pFilter = new CVirtualCameraFilter();
        if (!pFilter) return E_OUTOFMEMORY;
        
        HRESULT hr = pFilter->QueryInterface(riid, ppv);
        pFilter->Release(); // QueryInterface added a ref if successful
        return hr;
    }

    STDMETHODIMP LockServer(BOOL fLock) override
    {
        if (fLock)
            InterlockedIncrement(&g_cComLockCount);
        else
            InterlockedDecrement(&g_cComLockCount);
        return S_OK;
    }

private:
    long m_refCount;
};

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, void** ppv)
{
    if (rclsid != CLSID_VirtualCamera)
        return CLASS_E_CLASSNOTAVAILABLE;
        
    CClassFactory* pFactory = new CClassFactory();
    if (!pFactory)
        return E_OUTOFMEMORY;
        
    HRESULT hr = pFactory->QueryInterface(riid, ppv);
    pFactory->Release();
    return hr;
}

STDAPI DllCanUnloadNow(void)
{
    if (g_cComObjectCount == 0 && g_cComLockCount == 0)
        return S_OK;
    else
        return S_FALSE;
}

// Registry helpers for DllRegisterServer / DllUnregisterServer
const wchar_t* FILTER_NAME = L"VideoStudio Virtual Camera";

HRESULT RegisterFilter(CLSID clsid, LPCWSTR name, IFilterMapper2* pMapper)
{
    REGFILTER2 rf2;
    rf2.dwVersion = 2;
    rf2.dwMerit = MERIT_DO_NOT_USE;
    
    REGFILTERPINS2 rfp2 = {0};
    rfp2.cInstances = 1;
    rfp2.dwFlags = REG_PINFLAG_B_OUTPUT;
    
    REGPINTYPES rpt = {0};
    rpt.clsMajorType = &MEDIATYPE_Video;
    rpt.clsMinorType = &MEDIASUBTYPE_RGB32;
    
    rfp2.nMediaTypes = 1;
    rfp2.lpMediaType = &rpt;
    
    rf2.cPins2 = 1;
    rf2.rgPins2 = &rfp2;

    IMoniker* pMoniker = NULL;
    HRESULT hr = pMapper->RegisterFilter(clsid, name, &pMoniker, &CLSID_VideoInputDeviceCategory, NULL, &rf2);
    if (pMoniker) pMoniker->Release();
    return hr;
}

STDAPI DllRegisterServer(void)
{
    // Register COM object in HKCR\CLSID
    HKEY hKey;
    LONG lRes = RegCreateKeyExW(HKEY_CLASSES_ROOT, L"CLSID\\{E520D841-3F71-4198-8422-CDB66952F398}", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL);
    if (lRes == ERROR_SUCCESS)
    {
        RegSetValueExW(hKey, NULL, 0, REG_SZ, (const BYTE*)FILTER_NAME, (DWORD)(wcslen(FILTER_NAME) + 1) * sizeof(wchar_t));
        HKEY hInprocKey;
        if (RegCreateKeyExW(hKey, L"InprocServer32", 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hInprocKey, NULL) == ERROR_SUCCESS)
        {
            wchar_t szModule[MAX_PATH];
            GetModuleFileNameW(g_hInstance, szModule, MAX_PATH);
            RegSetValueExW(hInprocKey, NULL, 0, REG_SZ, (const BYTE*)szModule, (DWORD)(wcslen(szModule) + 1) * sizeof(wchar_t));
            const wchar_t* threadingModel = L"Both";
            RegSetValueExW(hInprocKey, L"ThreadingModel", 0, REG_SZ, (const BYTE*)threadingModel, (DWORD)(wcslen(threadingModel) + 1) * sizeof(wchar_t));
            RegCloseKey(hInprocKey);
        }
        RegCloseKey(hKey);
    }

    // Register DirectShow Filter
    CoInitialize(NULL);
    IFilterMapper2* pMapper = NULL;
    HRESULT hr = CoCreateInstance(CLSID_FilterMapper2, NULL, CLSCTX_INPROC_SERVER, IID_IFilterMapper2, (void**)&pMapper);
    if (SUCCEEDED(hr))
    {
        hr = RegisterFilter(CLSID_VirtualCamera, FILTER_NAME, pMapper);
        pMapper->Release();
    }
    CoUninitialize();
    return hr;
}

STDAPI DllUnregisterServer(void)
{
    // Unregister COM object
    RegDeleteTreeW(HKEY_CLASSES_ROOT, L"CLSID\\{E520D841-3F71-4198-8422-CDB66952F398}");

    // Unregister DirectShow Filter
    CoInitialize(NULL);
    IFilterMapper2* pMapper = NULL;
    HRESULT hr = CoCreateInstance(CLSID_FilterMapper2, NULL, CLSCTX_INPROC_SERVER, IID_IFilterMapper2, (void**)&pMapper);
    if (SUCCEEDED(hr))
    {
        hr = pMapper->UnregisterFilter(&CLSID_VideoInputDeviceCategory, NULL, CLSID_VirtualCamera);
        pMapper->Release();
    }
    CoUninitialize();
    return hr;
}
