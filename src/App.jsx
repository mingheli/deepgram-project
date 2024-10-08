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

  const formattedHours = String(hours).padStart(1, '0');
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
    size: (file?.size / (1024 * 1024)).toFixed(1)
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
  const [selectedModel, setSelectedModel] = useState("general");
  const [currentRawFile, setCurrentRawFile] = useState(null);
  const fileInputRef = useRef(null);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;

  useEffect(() => {
    // Initialize audioList with some initial loading data
    const initialData = [
      {
        id: 1,
        duration: "0:03:21",
        size: "3.4",
        name: "aaa.wav",
        transcript: "This is a sample transcript for example1.wav",
      },
      {
        id: 2,
        duration: "0:02:21",
        size: "2.4",
        name: "bbb.wav",
        transcript: "This is a sample transcript for example2.wav",
      },
      {
        id: 3,
        duration: "0:02:21",
        size: "2.4",
        name: "ccc.wav",
        transcript: "This is a sample transcript for example2.wav",
      },
    ];
    setAudioList(initialData);
  }, []);

  useEffect(() => {
    if (fileInputClicked && !fileInputRef.current.files.length) {
      setLoading(false);
      setFileInputClicked(false);
    }
  }, [fileInputClicked])

  const handleFileInputClick = () => {
    setFileInputClicked(true);
  }
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setLoading(false); //if user cancel select file, should disable the spinner
      setFileInputClicked(false);
      return;
    }
    setFiles([...files, selectedFile]);
    await fetchData(selectedFile);
  };

  const handleUploadClick = () => {
    setLoading(true);
    setError(false);
    fileInputRef.current.click();
  };

  const fetchData = async (file, currentModel = "general") => {
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
      const response = await fetch(`${DEEPGRAM_HOST}/v1/listen?language=en&model=nova-2-${currentModel}&smart_format=true`, options);
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

  const handleTranscribe = useCallback((flatFile) => {
    setCurrentFile(flatFile);
    const rFile = files.filter((file) => file.name === flatFile.name);
    if (rFile) {
      setCurrentRawFile(rFile[0]);
    }
  }, [currentFile]);

  const handleSelectModel = async (e) => {
    setSelectedModel(e.target.value);
    await fetchData(currentRawFile, e.target.value);
  }
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
      <div className="transcript-control">
        <div className="main-transcript">
          <div className="transcript-name">Transcript: {currentFile?.name}</div>
          <div className="transcript">{currentFile?.transcript ?? <span className="placeholder">Transcribing...</span>}</div>
        </div>
        <div className="side-transcript">
          <div className="transcript-name">Transcript: {currentFile?.name}</div>
          <div className="select-model">
            <select value={selectedModel} onChange={(e) => handleSelectModel(e)}>
              <option value="meeting">meeting</option>
              <option value="video">video</option>
              <option value="phonecall">phonecall</option>
              <option value="finance">finance</option>
              <option value="medical">medical</option>
            </select>
          </div>
          <div className="transcript">{currentFile?.transcript ?? <span className="placeholder">Transcribing...</span>}</div>
        </div>
      </div>
    </div>
  );
};
export default App;
