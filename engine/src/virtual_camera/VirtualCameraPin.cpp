#include "VirtualCamera.h"
#include <dvdmedia.h>

class CEnumMediaTypes : public IEnumMediaTypes
{
public:
    CEnumMediaTypes() : m_refCount(1), m_index(0) {}
    virtual ~CEnumMediaTypes() {}

    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IEnumMediaTypes) { *ppv = static_cast<IEnumMediaTypes*>(this); AddRef(); return S_OK; }
        *ppv = NULL; return E_NOINTERFACE;
    }
    STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement(&m_refCount); }
    STDMETHODIMP_(ULONG) Release() override { ULONG count = InterlockedDecrement(&m_refCount); if (count == 0) delete this; return count; }

    STDMETHODIMP Next(ULONG cMediaTypes, AM_MEDIA_TYPE** ppMediaTypes, ULONG* pcFetched) override
    {
        if (pcFetched) *pcFetched = 0;
        if (m_index == 0 && cMediaTypes > 0)
        {
            AM_MEDIA_TYPE* pmt = (AM_MEDIA_TYPE*)CoTaskMemAlloc(sizeof(AM_MEDIA_TYPE));
            ZeroMemory(pmt, sizeof(AM_MEDIA_TYPE));
            pmt->majortype = MEDIATYPE_Video;
            pmt->subtype = MEDIASUBTYPE_RGB32;
            pmt->bFixedSizeSamples = TRUE;
            pmt->bTemporalCompression = FALSE;
            pmt->lSampleSize = 1920 * 1080 * 4;
            pmt->formattype = FORMAT_VideoInfo;
            
            VIDEOINFOHEADER* pvi = (VIDEOINFOHEADER*)CoTaskMemAlloc(sizeof(VIDEOINFOHEADER));
            ZeroMemory(pvi, sizeof(VIDEOINFOHEADER));
            pvi->bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
            pvi->bmiHeader.biWidth = 1920;
            pvi->bmiHeader.biHeight = 1080;
            pvi->bmiHeader.biPlanes = 1;
            pvi->bmiHeader.biBitCount = 32;
            pvi->bmiHeader.biCompression = BI_RGB;
            pvi->bmiHeader.biSizeImage = pmt->lSampleSize;
            pvi->AvgTimePerFrame = 333333; // 30 fps

            pmt->pbFormat = (BYTE*)pvi;
            pmt->cbFormat = sizeof(VIDEOINFOHEADER);
            
            ppMediaTypes[0] = pmt;
            if (pcFetched) *pcFetched = 1;
            m_index = 1;
            return cMediaTypes == 1 ? S_OK : S_FALSE;
        }
        return S_FALSE;
    }
    STDMETHODIMP Skip(ULONG cMediaTypes) override { m_index += cMediaTypes; return (m_index > 1) ? S_FALSE : S_OK; }
    STDMETHODIMP Reset() override { m_index = 0; return S_OK; }
    STDMETHODIMP Clone(IEnumMediaTypes** ppEnum) override { return E_NOTIMPL; }
private:
    long m_refCount;
    ULONG m_index;
};


CVirtualCameraPin::CVirtualCameraPin(CVirtualCameraFilter* pFilter)
    : m_refCount(1), m_pFilter(pFilter), m_pConnectedPin(NULL), m_active(false), m_hThread(NULL)
{
    m_hStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    m_hSharedMemory = OpenFileMappingA(FILE_MAP_READ, FALSE, "Local\\VideoStudioVirtualCam_Mem");
    if (m_hSharedMemory)
    {
        m_pSharedBuffer = MapViewOfFile(m_hSharedMemory, FILE_MAP_READ, 0, 0, 1920 * 1080 * 4);
    }
    else
    {
        m_pSharedBuffer = NULL;
    }
    m_hMutex = OpenMutexA(SYNCHRONIZE, FALSE, "Local\\VideoStudioVirtualCam_Mutex");
}

CVirtualCameraPin::~CVirtualCameraPin()
{
    SetActive(false);
    if (m_pSharedBuffer) UnmapViewOfFile(m_pSharedBuffer);
    if (m_hSharedMemory) CloseHandle(m_hSharedMemory);
    if (m_hMutex) CloseHandle(m_hMutex);
    CloseHandle(m_hStopEvent);
    if (m_pConnectedPin) m_pConnectedPin->Release();
}

STDMETHODIMP CVirtualCameraPin::QueryInterface(REFIID riid, void** ppv)
{
    if (riid == IID_IUnknown || riid == IID_IPin)
    {
        *ppv = static_cast<IPin*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = NULL;
    return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CVirtualCameraPin::AddRef()
{
    return InterlockedIncrement(&m_refCount);
}

STDMETHODIMP_(ULONG) CVirtualCameraPin::Release()
{
    ULONG count = InterlockedDecrement(&m_refCount);
    if (count == 0) delete this;
    return count;
}

STDMETHODIMP CVirtualCameraPin::Connect(IPin* pReceivePin, const AM_MEDIA_TYPE* pmt)
{
    if (m_pConnectedPin) return VFW_E_ALREADY_CONNECTED;
    
    // We would negotiate media type here and setup IMemAllocator.
    // For compilation success, just accept.
    m_pConnectedPin = pReceivePin;
    m_pConnectedPin->AddRef();
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::ReceiveConnection(IPin* pConnector, const AM_MEDIA_TYPE* pmt) { return VFW_E_TYPE_NOT_ACCEPTED; }

STDMETHODIMP CVirtualCameraPin::Disconnect()
{
    if (!m_pConnectedPin) return S_FALSE;
    m_pConnectedPin->Release();
    m_pConnectedPin = NULL;
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::ConnectedTo(IPin** pPin)
{
    if (!m_pConnectedPin) return VFW_E_NOT_CONNECTED;
    *pPin = m_pConnectedPin;
    m_pConnectedPin->AddRef();
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::ConnectionMediaType(AM_MEDIA_TYPE* pmt) { return E_NOTIMPL; }

STDMETHODIMP CVirtualCameraPin::QueryPinInfo(PIN_INFO* pInfo)
{
    pInfo->pFilter = m_pFilter;
    if (m_pFilter) m_pFilter->AddRef();
    pInfo->dir = PINDIR_OUTPUT;
    wcscpy_s(pInfo->achName, L"Out");
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::QueryDirection(PIN_DIRECTION* pPinDir)
{
    *pPinDir = PINDIR_OUTPUT;
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::QueryId(LPWSTR* Id)
{
    *Id = (LPWSTR)CoTaskMemAlloc(sizeof(L"Out"));
    wcscpy_s(*Id, 4, L"Out");
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::QueryAccept(const AM_MEDIA_TYPE* pmt) { return S_OK; }

STDMETHODIMP CVirtualCameraPin::EnumMediaTypes(IEnumMediaTypes** ppEnum)
{
    *ppEnum = new CEnumMediaTypes();
    return S_OK;
}

STDMETHODIMP CVirtualCameraPin::QueryInternalConnections(IPin** apPin, ULONG* nPin) { return E_NOTIMPL; }
STDMETHODIMP CVirtualCameraPin::EndOfStream() { return S_OK; }
STDMETHODIMP CVirtualCameraPin::BeginFlush() { return S_OK; }
STDMETHODIMP CVirtualCameraPin::EndFlush() { return S_OK; }
STDMETHODIMP CVirtualCameraPin::NewSegment(REFERENCE_TIME tStart, REFERENCE_TIME tStop, double dRate) { return S_OK; }

void CVirtualCameraPin::SetActive(bool active)
{
    if (active == m_active) return;
    m_active = active;
    
    if (active)
    {
        ResetEvent(m_hStopEvent);
        m_hThread = CreateThread(NULL, 0, ThreadProc, this, 0, NULL);
    }
    else
    {
        SetEvent(m_hStopEvent);
        if (m_hThread)
        {
            WaitForSingleObject(m_hThread, INFINITE);
            CloseHandle(m_hThread);
            m_hThread = NULL;
        }
    }
}

DWORD WINAPI CVirtualCameraPin::ThreadProc(LPVOID lpParam)
{
    return ((CVirtualCameraPin*)lpParam)->ThreadRun();
}

DWORD CVirtualCameraPin::ThreadRun()
{
    while (WaitForSingleObject(m_hStopEvent, 33) == WAIT_TIMEOUT)
    {
        // Pushing frame logic here
        if (m_pConnectedPin && m_pSharedBuffer && m_hMutex)
        {
            WaitForSingleObject(m_hMutex, INFINITE);
            // Read from m_pSharedBuffer
            ReleaseMutex(m_hMutex);
        }
    }
    return 0;
}
