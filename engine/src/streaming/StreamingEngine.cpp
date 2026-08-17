#include "StreamingEngine.h"
#include <iostream>
#include <vector>

namespace vs_engine {
namespace streaming {

StreamingEngine::StreamingEngine() {}

StreamingEngine::~StreamingEngine() {
    stopStreaming();
}

bool StreamingEngine::startStreaming(const std::string& ffmpegPath, const std::string& rtmpUrl, int videoBitrate, int audioBitrate, int fps) {
    if (m_isStreaming) return false;

    std::string videoPipeName = "\\\\.\\pipe\\videostudio_vid";
    std::string audioPipeName = "\\\\.\\pipe\\videostudio_aud";

    // Create video pipe
    m_hVideoPipe = CreateNamedPipeA(
        videoPipeName.c_str(),
        PIPE_ACCESS_OUTBOUND,
        PIPE_TYPE_BYTE | PIPE_WAIT,
        1,
        1920 * 1080 * 4 * 2,
        1920 * 1080 * 4 * 2,
        0,
        NULL
    );

    // Create audio pipe
    m_hAudioPipe = CreateNamedPipeA(
        audioPipeName.c_str(),
        PIPE_ACCESS_OUTBOUND,
        PIPE_TYPE_BYTE | PIPE_WAIT,
        1,
        48000 * 2 * 4 * 2,
        48000 * 2 * 4 * 2,
        0,
        NULL
    );

    if (m_hVideoPipe == INVALID_HANDLE_VALUE || m_hAudioPipe == INVALID_HANDLE_VALUE) {
        if (m_hVideoPipe != INVALID_HANDLE_VALUE) { CloseHandle(m_hVideoPipe); m_hVideoPipe = INVALID_HANDLE_VALUE; }
        if (m_hAudioPipe != INVALID_HANDLE_VALUE) { CloseHandle(m_hAudioPipe); m_hAudioPipe = INVALID_HANDLE_VALUE; }
        return false;
    }

    std::string cmd = ffmpegPath + " -y -f rawvideo -vcodec rawvideo -pix_fmt bgra -s 1920x1080 -r " + std::to_string(fps) + 
                      " -i " + videoPipeName + " -f f32le -ar 48000 -ac 2 -i " + audioPipeName + 
                      " -c:v libx264 -preset veryfast -b:v " + std::to_string(videoBitrate) + "k -maxrate " + std::to_string(videoBitrate) + "k -bufsize " + std::to_string(videoBitrate * 2) + "k" +
                      " -pix_fmt yuv420p -g " + std::to_string(fps * 2) + " -c:a aac -b:a " + std::to_string(audioBitrate) + "k -f flv \"" + rtmpUrl + "\"";

    STARTUPINFOA si;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    // Hide console window
    si.dwFlags |= STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;

    PROCESS_INFORMATION pi;
    ZeroMemory(&pi, sizeof(pi));

    std::vector<char> cmdBuf(cmd.begin(), cmd.end());
    cmdBuf.push_back('\0');

    if (!CreateProcessA(NULL, cmdBuf.data(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        CloseHandle(m_hVideoPipe);
        CloseHandle(m_hAudioPipe);
        m_hVideoPipe = INVALID_HANDLE_VALUE;
        m_hAudioPipe = INVALID_HANDLE_VALUE;
        return false;
    }

    m_hProcess = pi.hProcess;
    m_hThread = pi.hThread;

    m_isStreaming = true;
    m_videoConnected = false;
    m_audioConnected = false;

    m_videoThread = std::thread(&StreamingEngine::videoConnectThread, this);
    m_audioThread = std::thread(&StreamingEngine::audioConnectThread, this);

    return true;
}

void StreamingEngine::videoConnectThread() {
    if (ConnectNamedPipe(m_hVideoPipe, NULL)) {
        m_videoConnected = true;
    } else {
        if (GetLastError() == ERROR_PIPE_CONNECTED) {
            m_videoConnected = true;
        }
    }
}

void StreamingEngine::audioConnectThread() {
    if (ConnectNamedPipe(m_hAudioPipe, NULL)) {
        m_audioConnected = true;
    } else {
        if (GetLastError() == ERROR_PIPE_CONNECTED) {
            m_audioConnected = true;
        }
    }
}

void StreamingEngine::stopStreaming() {
    if (!m_isStreaming) return;
    m_isStreaming = false;

    // Disconnect and close pipes to unblock ConnectNamedPipe or WriteFile
    if (m_hVideoPipe != INVALID_HANDLE_VALUE) {
        DisconnectNamedPipe(m_hVideoPipe);
        HANDLE h = m_hVideoPipe;
        m_hVideoPipe = INVALID_HANDLE_VALUE;
        CloseHandle(h);
    }

    if (m_hAudioPipe != INVALID_HANDLE_VALUE) {
        DisconnectNamedPipe(m_hAudioPipe);
        HANDLE h = m_hAudioPipe;
        m_hAudioPipe = INVALID_HANDLE_VALUE;
        CloseHandle(h);
    }

    if (m_videoThread.joinable()) {
        m_videoThread.join();
    }
    
    if (m_audioThread.joinable()) {
        m_audioThread.join();
    }

    if (m_hProcess) {
        TerminateProcess(m_hProcess, 0);
        CloseHandle(m_hProcess);
        CloseHandle(m_hThread);
        m_hProcess = nullptr;
        m_hThread = nullptr;
    }

    m_videoConnected = false;
    m_audioConnected = false;
}

void StreamingEngine::pushVideoFrame(const uint8_t* buffer, size_t length) {
    if (!m_isStreaming || !m_videoConnected || m_hVideoPipe == INVALID_HANDLE_VALUE) return;
    std::lock_guard<std::mutex> lock(m_videoMutex);
    DWORD written = 0;
    WriteFile(m_hVideoPipe, buffer, (DWORD)length, &written, NULL);
}

void StreamingEngine::pushAudioBuffer(const uint8_t* buffer, size_t length) {
    if (!m_isStreaming || !m_audioConnected || m_hAudioPipe == INVALID_HANDLE_VALUE) return;
    std::lock_guard<std::mutex> lock(m_audioMutex);
    DWORD written = 0;
    WriteFile(m_hAudioPipe, buffer, (DWORD)length, &written, NULL);
}

} // namespace streaming
} // namespace vs_engine
