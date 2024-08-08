import React, { useState, useRef, useCallback, useEffect } from "react";
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
  const [fileInputClicked, setFileInputClicked] = useState(false);
  const fileInputRef = useRef(null);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;

  useEffect(() => {
    if (fileInputClicked && !fileInputRef.current.files.length) {
      setLoading(false);
      setFileInputClicked(false);
    }
  }, [fileInputClicked])

  const handleFileInputClick = () => {
    setFileInputClicked(true);
  }
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setLoading(false); //if user cancel select file, should disable the spinner
      setFileInputClicked(false);
      return;
    }
    setFiles([...files, selectedFile]);
    fetchData(selectedFile);
  };

  const handleUploadClick = () => {
    setLoading(true);
    setError(false);
    fileInputRef.current.click();
  };

  const fetchData = async (file) => {
    setLoading(true);
    const options = {
      method: "POST",
      headers: {
        'Content-Type': 'audio/wav',
        "Authorization": `Token ${TOKEN}`,
      },
      body: file,
    }
    try {
      const response = await fetch(`${DEEPGRAM_HOST}/v1/listen?language=en&model=enhanced&smart_format=true`, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.err_msg);
      }
      setAudioList([...audioList, flatData(data, file)]);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.log(error);
      setError(error.message);
      setLoading(false);
    }
  }

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
        {/* {loading && <FontAwesomeIcon icon={faSpinner} spin />} */}
        <button onClick={handleUploadClick} disabled={loading} className="custom-file-upload">
          Upload a file
        </button>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          onClick={handleFileInputClick}
          onChange={handleFileChange} />
      </div>
      {error && <div className="error">
        <FontAwesomeIcon icon={faWarning} /> {error}
      </div>}
      <div className='grid'>
        <Header />
        <Audios audioList={audioList} handleTranscribe={handleTranscribe} currentFile={currentFile} />
      </div>
      <div className="transcript-name">Transcript: {currentFile?.name}</div>
      <div className="transcript">{currentFile?.transcript}</div>
    </div>
  );
};
export default App;
