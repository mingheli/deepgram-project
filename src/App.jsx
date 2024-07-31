import React, { useState } from "react";
import Header from "./components/Header";
import Audios from "./components/Audios";
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
    name: file.name,
    duration: formatDuration(metadata.duration),
    transcript: results.channels[0].alternatives[0].transcript,
    size: (file.size / (1024 * 1024)).toFixed(2)
  });
}

const App = () => {
  const [files, setFiles] = useState([]);
  const [audioList, setAudioList] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFiles([...files, selectedFile]);
    fetchData(selectedFile);
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
    const response = await fetch(`${DEEPGRAM_HOST}/v1/listen?language=en&model=enhanced&smart_format=true`, options);
    const data = await response.json();
    setAudioList([...audioList, flatData(data, file)]);
    setLoading(false);
  }
  const handleTranscribe = (file) => {
    setShowTranscript(true);
    setCurrentFile(file);
  }

  return (
    <div className="wrapper">
      <div className="title">
        <h2>Deepgram Audio Server</h2>
      </div>
      <div className="upload">
        {loading && <div className="loading-spinner"></div>}
        <label htmlFor="file-upload" className="custom-file-upload">
          Upload a file
        </label>
        <input id="file-upload" type="file" onChange={handleFileChange} />
      </div>
      <div className='grid'>
        <Header />
        <Audios audioList={audioList} handleTranscribe={handleTranscribe} />
      </div>
      {currentFile && <div className="transcriptName">Transcript: {currentFile.name}</div>}
      {currentFile && <div className="transcript">{currentFile.transcript}</div>}
    </div>
  );
};
export default App;
