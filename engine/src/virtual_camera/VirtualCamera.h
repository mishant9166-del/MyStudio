#pragma once
#include <windows.h>
#include <dshow.h>

// {E520D841-3F71-4198-8422-CDB66952F398}
DEFINE_GUID(CLSID_VirtualCamera, 
0xe520d841, 0x3f71, 0x4198, 0x84, 0x22, 0xcd, 0xb6, 0x69, 0x52, 0xf3, 0x98);

extern long g_cComObjectCount;
extern long g_cComLockCount;

class CVirtualCameraPin;

class CVirtualCameraFilter : public IBaseFilter
{
public:
    CVirtualCameraFilter();
    virtual ~CVirtualCameraFilter();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override;
    STDMETHODIMP_(ULONG) AddRef() override;
    STDMETHODIMP_(ULONG) Release() override;

    // IPersist
    STDMETHODIMP GetClassID(CLSID* pClassID) override;

    // IMediaFilter
    STDMETHODIMP Stop() override;
    STDMETHODIMP Pause() override;
    STDMETHODIMP Run(REFERENCE_TIME tStart) override;
    STDMETHODIMP GetState(DWORD dwMilliSecsTimeout, FILTER_STATE* State) override;
    STDMETHODIMP SetSyncSource(IReferenceClock* pClock) override;
    STDMETHODIMP GetSyncSource(IReferenceClock** pClock) override;

    // IBaseFilter
    STDMETHODIMP EnumPins(IEnumPins** ppEnum) override;
    STDMETHODIMP FindPin(LPCWSTR Id, IPin** ppPin) override;
    STDMETHODIMP QueryFilterInfo(FILTER_INFO* pInfo) override;
    STDMETHODIMP JoinFilterGraph(IFilterGraph* pGraph, LPCWSTR pName) override;
    STDMETHODIMP QueryVendorInfo(LPWSTR* pVendorInfo) override;

private:
    long m_refCount;
    FILTER_STATE m_state;
    IReferenceClock* m_pClock;
    IFilterGraph* m_pGraph;
    CVirtualCameraPin* m_pPin;
};

class CVirtualCameraPin : public IPin
{
public:
    CVirtualCameraPin(CVirtualCameraFilter* pFilter);
    virtual ~CVirtualCameraPin();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) override;
    STDMETHODIMP_(ULONG) AddRef() override;
    STDMETHODIMP_(ULONG) Release() override;

    // IPin
    STDMETHODIMP Connect(IPin* pReceivePin, const AM_MEDIA_TYPE* pmt) override;
    STDMETHODIMP ReceiveConnection(IPin* pConnector, const AM_MEDIA_TYPE* pmt) override;
    STDMETHODIMP Disconnect() override;
    STDMETHODIMP ConnectedTo(IPin** pPin) override;
    STDMETHODIMP ConnectionMediaType(AM_MEDIA_TYPE* pmt) override;
    STDMETHODIMP QueryPinInfo(PIN_INFO* pInfo) override;
    STDMETHODIMP QueryDirection(PIN_DIRECTION* pPinDir) override;
    STDMETHODIMP QueryId(LPWSTR* Id) override;
    STDMETHODIMP QueryAccept(const AM_MEDIA_TYPE* pmt) override;
    STDMETHODIMP EnumMediaTypes(IEnumMediaTypes** ppEnum) override;
    STDMETHODIMP QueryInternalConnections(IPin** apPin, ULONG* nPin) override;
    STDMETHODIMP EndOfStream() override;
    STDMETHODIMP BeginFlush() override;
    STDMETHODIMP EndFlush() override;
    STDMETHODIMP NewSegment(REFERENCE_TIME tStart, REFERENCE_TIME tStop, double dRate) override;

    void SetActive(bool active);

private:
    long m_refCount;
    CVirtualCameraFilter* m_pFilter;
    IPin* m_pConnectedPin;
    
    bool m_active;
    HANDLE m_hThread;
    HANDLE m_hStopEvent;

    HANDLE m_hSharedMemory;
    void* m_pSharedBuffer;
    HANDLE m_hMutex;

    static DWORD WINAPI ThreadProc(LPVOID lpParam);
    DWORD ThreadRun();
};
