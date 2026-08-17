#include "VirtualCamera.h"

//
// IEnumPins Implementation Stub
//
class CEnumPins : public IEnumPins
{
public:
    CEnumPins(CVirtualCameraPin* pPin) : m_refCount(1), m_pPin(pPin), m_index(0) { if(m_pPin) m_pPin->AddRef(); }
    virtual ~CEnumPins() { if(m_pPin) m_pPin->Release(); }

    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IEnumPins) { *ppv = static_cast<IEnumPins*>(this); AddRef(); return S_OK; }
        *ppv = NULL; return E_NOINTERFACE;
    }
    STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement(&m_refCount); }
    STDMETHODIMP_(ULONG) Release() override { ULONG count = InterlockedDecrement(&m_refCount); if (count == 0) delete this; return count; }

    STDMETHODIMP Next(ULONG cPins, IPin** ppPins, ULONG* pcFetched) override
    {
        if (pcFetched) *pcFetched = 0;
        if (m_index == 0 && cPins > 0)
        {
            m_pPin->AddRef();
            ppPins[0] = m_pPin;
            if (pcFetched) *pcFetched = 1;
            m_index = 1;
            return cPins == 1 ? S_OK : S_FALSE;
        }
        return S_FALSE;
    }
    STDMETHODIMP Skip(ULONG cPins) override { m_index += cPins; return (m_index > 1) ? S_FALSE : S_OK; }
    STDMETHODIMP Reset() override { m_index = 0; return S_OK; }
    STDMETHODIMP Clone(IEnumPins** ppEnum) override { return E_NOTIMPL; }
private:
    long m_refCount;
    CVirtualCameraPin* m_pPin;
    ULONG m_index;
};


CVirtualCameraFilter::CVirtualCameraFilter() : m_refCount(1), m_state(State_Stopped), m_pClock(NULL), m_pGraph(NULL)
{
    InterlockedIncrement(&g_cComObjectCount);
    m_pPin = new CVirtualCameraPin(this);
}

CVirtualCameraFilter::~CVirtualCameraFilter()
{
    if (m_pPin) m_pPin->Release();
    if (m_pClock) m_pClock->Release();
    InterlockedDecrement(&g_cComObjectCount);
}

STDMETHODIMP CVirtualCameraFilter::QueryInterface(REFIID riid, void** ppv)
{
    if (riid == IID_IUnknown || riid == IID_IBaseFilter || riid == IID_IMediaFilter || riid == IID_IPersist)
    {
        *ppv = static_cast<IBaseFilter*>(this);
        AddRef();
        return S_OK;
    }
    *ppv = NULL;
    return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CVirtualCameraFilter::AddRef()
{
    return InterlockedIncrement(&m_refCount);
}

STDMETHODIMP_(ULONG) CVirtualCameraFilter::Release()
{
    ULONG count = InterlockedDecrement(&m_refCount);
    if (count == 0) delete this;
    return count;
}

STDMETHODIMP CVirtualCameraFilter::GetClassID(CLSID* pClassID)
{
    *pClassID = CLSID_VirtualCamera;
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::Stop()
{
    m_state = State_Stopped;
    m_pPin->SetActive(false);
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::Pause()
{
    m_state = State_Paused;
    m_pPin->SetActive(true);
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::Run(REFERENCE_TIME tStart)
{
    m_state = State_Running;
    m_pPin->SetActive(true);
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::GetState(DWORD dwMilliSecsTimeout, FILTER_STATE* State)
{
    *State = m_state;
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::SetSyncSource(IReferenceClock* pClock)
{
    if (m_pClock) m_pClock->Release();
    m_pClock = pClock;
    if (m_pClock) m_pClock->AddRef();
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::GetSyncSource(IReferenceClock** pClock)
{
    *pClock = m_pClock;
    if (m_pClock) m_pClock->AddRef();
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::EnumPins(IEnumPins** ppEnum)
{
    *ppEnum = new CEnumPins(m_pPin);
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::FindPin(LPCWSTR Id, IPin** ppPin)
{
    if (wcscmp(Id, L"Out") == 0)
    {
        m_pPin->AddRef();
        *ppPin = m_pPin;
        return S_OK;
    }
    *ppPin = NULL;
    return VFW_E_NOT_FOUND;
}

STDMETHODIMP CVirtualCameraFilter::QueryFilterInfo(FILTER_INFO* pInfo)
{
    pInfo->pGraph = m_pGraph;
    if (m_pGraph) m_pGraph->AddRef();
    wcscpy_s(pInfo->achName, L"VirtualCamera");
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::JoinFilterGraph(IFilterGraph* pGraph, LPCWSTR pName)
{
    m_pGraph = pGraph;
    return S_OK;
}

STDMETHODIMP CVirtualCameraFilter::QueryVendorInfo(LPWSTR* pVendorInfo)
{
    return E_NOTIMPL;
}
