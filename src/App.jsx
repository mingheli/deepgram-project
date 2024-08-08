import React, { useState, useRef, useCallback } from "react";
import Header from "./components/Header";
import Audios from "./components/Audios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from 'uuid';
import "./App.css";

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(0);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(secs).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const flatData = (data, file) => {
  const { metadata, results } = data
  return ({
    id: uuidv4(),
    name: file?.name,
    duration: formatDuration(metadata?.duration),
    transcript: results?.channels[0].alternatives[0].transcript,
    size: (file?.size / (1024 * 1024)).toFixed(2)
  });
}

const App = () => {
  const [files, setFiles] = useState([]);
  const [audioList, setAudioList] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setFiles([...files, selectedFile]);
    setLoading(false);
    await fetchData(selectedFile);
  };

  const handleUploadClick = () => {
    setLoading(true);
    setError(false);
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const fetchData = async (file) => {
    const requestId = uuidv4(); // Generate a unique requestId
    const newAudio = {
      id: requestId,
      name: file?.name,
      duration: null, // Initially null, will be updated later
      transcript: null, // Initially null, will be updated later
      size: (file?.size / (1024 * 1024)).toFixed(2)
    };
    setAudioList((prevAudioList) => [...prevAudioList, newAudio]);

    const options = {
      method: "POST",
      headers: {
        'Content-Type': 'audio/wav',
        'Authorization': `Token ${TOKEN}`
      },
      body: file
    };

    const response = await fetch(`${DEEPGRAM_HOST}/v1/listen`, options);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const { metadata, results } = data;

    // Update the audio object with the new data
    setAudioList((prevAudioList) =>
      prevAudioList.map((audio) =>
        audio.id === requestId
          ? {
            ...audio,
            duration: formatDuration(metadata?.duration),
            transcript: results?.channels[0].alternatives[0].transcript
          }
          : audio
      )
    );
    setLoading(false);
    setError(null);
  };

  const refetchData = async (file) => {
    const options = {
      method: "POST",
      headers: {
        'Content-Type': 'audio/wav',
        'Authorization': `Token ${TOKEN}`
      },
      body: file
    };

    const response = await fetch(`${DEEPGRAM_HOST}/v1/listen`, options);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const { metadata, results } = data;

    // Update the audio object with the new data
    setAudioList((prevAudioList) =>
      prevAudioList.map((audio) =>
        audio.id === requestId
          ? {
            ...audio,
            duration: formatDuration(metadata?.duration),
            transcript: results?.channels[0].alternatives[0].transcript
          }
          : audio
      )
    );
    setLoading(false);
    setError(null);
  };

  const handleTranscribe = useCallback((file) => {
    setShowTranscript(true);
    setCurrentFile(file);
  }, [showTranscript, currentFile]);

  return (
    <div className="wrapper">
      <div className="title">
        <h2>Deepgram Audio Server</h2>
      </div>
      <div className="upload">
        {loading && <div className="loading-spinner"></div>}
        <button onClick={handleUploadClick} disabled={loading} className="custom-file-upload">
          Upload a file
        </button>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          onChange={handleFileChange} />
      </div>
      {error && <div className="error">
        <FontAwesomeIcon icon={faWarning} /> {error}
      </div>}
      <div className='grid'>
        <Header />
        <Audios audioList={audioList} handleTranscribe={handleTranscribe} currentFile={currentFile} refetchData={refetchData} />
      </div>
      <div className="transcript-name">Transcript: {currentFile?.name}</div>
      <div className="transcript">{currentFile?.transcript}</div>
    </div>
  );
};
export default App;
