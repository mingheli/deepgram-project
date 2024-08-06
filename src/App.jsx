import React, { useState, useRef } from "react";
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
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 2;
  const [sortingDirections, setSortingDirections] = useState({
    name: "UNSORTED",
    duration: "UNSORTED",
    size: "UNSORTED",

  })
  const fileInputRef = useRef(null);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFiles([...files, selectedFile]);
    fetchData(selectedFile);
  };

  const fetchData = async (file) => {
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
        throw new Error(data.err_msg || 'Error uploading, please retry');
      }
      setAudioList([...audioList, flatData(data, file)]);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.log(error);
      setError("Error uploading, please retry");
      setLoading(false);
    }
  }
  const handleUploadClick = () => {
    setLoading(true);
    fileInputRef.current.click();
  };

  const handleTranscribe = (file) => {
    setShowTranscript(true);
    setCurrentFile(file);
  }
  const sortData = (audioList, sortKey, sortDirection) => {
    return audioList.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortDirection === "ASCENDING" || sortDirection === "UNSORTED") {
        if (av > bv) return 1;
        if (av < bv) return -1;
        return 0;
      } else {
        if (av > bv) return -1;
        if (av < bv) return 1;
        return 0;
      }
    })
  }
  const getNextSortDirection = (currentSortDirection) => {
    if (currentSortDirection === "ASCENDING" || currentSortDirection === "UNSORTED") {
      return "DESCENDING";
    } else {
      return "ASCENDING";
    }
  }
  const sortColumn = (sortKey) => {
    const newAudioList = [...audioList];
    const currentSortDirection = sortingDirections[sortKey];
    sortData(newAudioList, sortKey, currentSortDirection);
    const nextSortDirection = getNextSortDirection(currentSortDirection);
    const newSortingDirections = { ...sortingDirections };
    newSortingDirections[sortKey] = nextSortDirection;
    setSortingDirections(newSortingDirections);
    setAudioList(newAudioList);
  }
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return audioList.slice(startIndex, endIndex);
  }
  const handleNextPage = () => {
    if (currentPage < Math.ceil(audioList.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  }
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  return (
    <div className="wrapper">
      <div className="title">
        <h2>Deepgram Audio Server</h2>
      </div>
      <div className="action-row">
        <div className="search">
          <label htmlFor="search-input" className="search-input">Search</label>
          <input id="search-input" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
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
            onChange={handleFileChange} />
        </div>
      </div>

      {error && <div className="error">
        <FontAwesomeIcon icon={faWarning} /> {error}
      </div>}
      <div className='grid'>
        <Header sortColumn={sortColumn} sortingDirections={sortingDirections} />
        <Audios audioList={audioList}
          handleTranscribe={handleTranscribe}
          searchKey={searchValue}
          getPaginatedData={getPaginatedData}
          currentFile={currentFile} />
      </div>
      <div className="transcriptName">Transcript: {currentFile?.name}</div>
      <div className="transcript">{currentFile?.transcript}</div>
      <div className="audio-player">
        <audio controls src={`/assets/${currentFile?.name}`}>
          Your browser doesn't support the audio element
        </audio>
      </div>
      <div className="pagination-control">
        <button onClick={handlePreviousPage} disable={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {Math.ceil(audioList.length / itemsPerPage)}</span>
        <button onClick={handleNextPage} disable={currentPage === Math.ceil(audioList.length / itemsPerPage)}>
          Next
        </button>
      </div>
    </div>
  );
};
export default App;
