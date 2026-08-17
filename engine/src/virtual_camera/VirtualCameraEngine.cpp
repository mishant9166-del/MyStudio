#include "VirtualCameraEngine.h"
#include <iostream>

namespace vs_engine {

#define BUF_SIZE 1920 * 1080 * 4
TCHAR szName[] = TEXT("Local\\VideoStudioVirtualCam_Mem");
TCHAR szEventName[] = TEXT("Local\\VideoStudioVirtualCam_Event");

VirtualCameraEngine::VirtualCameraEngine() : m_running(false), m_hMapFile(NULL), m_pBuf(NULL), m_hEvent(NULL) {
}

VirtualCameraEngine::~VirtualCameraEngine() {
    stop();
}

bool VirtualCameraEngine::start() {
    if (m_running) return true;

    m_hMapFile = CreateFileMapping(
        INVALID_HANDLE_VALUE,    // use paging file
        NULL,                    // default security
        PAGE_READWRITE,          // read/write access
        0,                       // maximum object size (high-order DWORD)
        BUF_SIZE,                // maximum object size (low-order DWORD)
        szName);                 // name of mapping object

    if (m_hMapFile == NULL) {
        std::cerr << "Could not create file mapping object (" << GetLastError() << ").\n";
        return false;
    }

    m_pBuf = (unsigned char*) MapViewOfFile(m_hMapFile,   // handle to map object
        FILE_MAP_ALL_ACCESS, // read/write permission
        0,
        0,
        BUF_SIZE);

    if (m_pBuf == NULL) {
        std::cerr << "Could not map view of file (" << GetLastError() << ").\n";
        CloseHandle(m_hMapFile);
        m_hMapFile = NULL;
        return false;
    }

    // Create event for synchronization
    m_hEvent = CreateEvent(NULL, FALSE, FALSE, szEventName);
    if (m_hEvent == NULL) {
        std::cerr << "Could not create event object (" << GetLastError() << ").\n";
        UnmapViewOfFile(m_pBuf);
        CloseHandle(m_hMapFile);
        return false;
    }

    m_running = true;
    return true;
}

void VirtualCameraEngine::stop() {
    if (!m_running) return;
    
    m_running = false;

    if (m_pBuf) {
        UnmapViewOfFile(m_pBuf);
        m_pBuf = NULL;
    }

    if (m_hMapFile) {
        CloseHandle(m_hMapFile);
        m_hMapFile = NULL;
    }

    if (m_hEvent) {
        CloseHandle(m_hEvent);
        m_hEvent = NULL;
    }
}

void VirtualCameraEngine::pushFrame(const unsigned char* buffer, size_t length) {
    if (!m_running || !m_pBuf) return;
    
    // Copy frame to shared memory
    if (length <= BUF_SIZE) {
        memcpy(m_pBuf, buffer, length);
        SetEvent(m_hEvent); // Notify filter that a new frame is ready
    }
}

} // namespace vs_engine
