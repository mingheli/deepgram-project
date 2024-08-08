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
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [sortingDirections, setSortingDirections] = useState({
    name: "unsorted",
    duration: "unsorted",
    size: "unsorted"
  });
  const itemsPerPage = 2;
  const fileInputRef = useRef(null);

  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;

  useEffect(() => {
    if (fileInputClicked && !fileInputRef.current.files.length) {
      setLoading(false);
      setFileInputClicked(false);
    }
  }, [fileInputClicked])

  useEffect(() => {
    // Initialize audioList with some initial loading data
    const initialData = [
      {
        id: 1,
        duration: "0.03:21",
        size: "3.4MB",
        name: "aaa.wav",
        transcript: "This is a sample transcript for example1.wav",
      },
      {
        id: 2,
        duration: "0.02:21",
        size: "2.4MB",
        name: "bbb.wav",
        transcript: "This is a sample transcript for example2.wav",
      },
      {
        id: 3,
        duration: "0.02:21",
        size: "2.4MB",
        name: "ccc.wav",
        transcript: "This is a sample transcript for example2.wav",
      },
    ];
    setAudioList(initialData);
  }, []);

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

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return audioList.slice(startIndex, endIndex);
  }
  const handlePreviousClick = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }
  const handleNextClick = () => {
    if (currentPage < Math.ceil(audioList.length / itemsPerPage)) setCurrentPage(currentPage + 1);
  }
  const sortData = (data, sortKey, sortDirection) => {
    return data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortDirection === "unsorted" || sortDirection === "ascending") {
        if (va > vb) return 1;
        if (va < vb) return -1;
        return 0;
      } else {
        if (va > vb) return -1;
        if (va < vb) return 1;
        return 0;
      }
    })
  }
  const getNextSortingDirection = (currentSortingDirection) => {
    if (currentSortingDirection === "unsorted" || currentSortingDirection === "ascending") return "descending";
    else return "ascending";
  }
  const sortColumn = (sortKey) => {
    setSelectedColumn(sortKey);
    const newAudioList = [...audioList];
    const currentSortingDirection = sortingDirections[sortKey];
    const sortedData = sortData(newAudioList, sortKey, currentSortingDirection);
    setAudioList(sortedData);

    const newSortingDirections = { ...sortingDirections };
    newSortingDirections[sortKey] = getNextSortingDirection(currentSortingDirection);
    setSortingDirections(newSortingDirections);

  }
  return (
    <div className="wrapper">
      <div className="title">
        <h2>Deepgram Audio Server</h2>
      </div>
      <div className="action-control">
        <div className="search">
          <label className="searchLabel" htmlFor="search-input">Search</label>
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
            onClick={handleFileInputClick}
            onChange={handleFileChange} />
        </div>
      </div>

      {error && <div className="error">
        <FontAwesomeIcon icon={faWarning} /> {error}
      </div>}
      <div className='grid'>
        <Header
          selectedColumn={selectedColumn}
          sortColumn={sortColumn}
          sortingDirections={sortingDirections} />
        <Audios audioList={audioList}
          handleTranscribe={handleTranscribe}
          currentFile={currentFile}
          searchKey={searchValue}
          getPaginatedData={getPaginatedData} />
      </div>
      <div className="transcript-name">Transcript: {currentFile?.name}</div>
      <div className="transcript">{currentFile?.transcript}</div>
      <div className="audio-player-control">
        <audio controls src={`/assets/${currentFile?.name}`} />
      </div>
      <div className="pagination-control">
        <button className="previous" onClick={handlePreviousClick} disabled={currentPage === 1}>Previous</button>
        <div>{currentPage} of {Math.ceil(audioList.length / itemsPerPage)}</div>
        <button className="next" onClick={handleNextClick} disabled={currentPage === Math.ceil(audioList.length / itemsPerPage)}>Next</button>
      </div>
    </div>
  );
};
export default App;
