import React, { useState } from 'react';
import { formatDuration } from "./utils/formatterUtils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faWarning } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';

import "./App.css";

const flatData = (data, file) => {
  const result = {
    id: uuidv4(),
    name: file?.name,
    size: `${(file?.size / (1024 * 1024)).toFixed(2)}MB`,
    duration: formatDuration(data?.metadata?.duration),
    transcript: data?.results?.channels[0]?.alternatives[0]?.transcript
  };
  return result;

}

const App = () => {
  const [files, setFiles] = useState([]);
  const [audios, setAudios] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2; // Number of items per page
  const [sortingDirections, setSortingDirections] = useState({
    name: "UNSORTED",
    size: "UNSORTED",
    duration: "UNSORTED"
  });
  const [error, setError] = useState(null);
  const fetchData = async (file) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
        "Authorization": "Token dfb060e548c19845f05c27a03e94b24748b5fb05"
      },
      body: file
    }
    setLoading(true);
    try {
      const resp = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", options);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.err_msg || 'Error uploading, please retry');
      }
      const displayData = flatData(data, file);
      setLoading(false);
      setError(false);
      return displayData;
    } catch (error) {
      console.log(error);
      setError("Error uploading, please retry");
      setLoading(false);
    }
  }
  const handleFileChange = async (event) => {
    const newAudio = await fetchData(event.target.files[0]);
    setFiles([...files, files[0]]);
    setAudios([...audios, newAudio]);
  }
  const handleTranscript = (file) => {
    setCurrentFile(file);
    setError(null);
  }
  const handleFileDownload = (file) => {
    const element = document.createElement('a');
    const fileContent = file.transcript;
    const blob = new Blob([fileContent], { type: "text/plain" });
    element.href = URL.createObjectURL(blob);
    element.download = `${file.name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setError(null);
  }
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return audios.slice(startIndex, endIndex);
  };
  const handleNextPage = () => {
    if (currentPage < Math.ceil(audios.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const sortData = (data, sortKey, sortingDirection) => {
    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortingDirection === "ASCENDING" || sortingDirection === "UNSORTED") {
        if (va > vb) return 1;
        if (va < vb) return -1;
        return 0;
      } else {
        if (va > vb) return -1;
        if (va < vb) return 1;
        return 0;
      }
    });
  };

  const getNextDirection = (sortingDirection) => {
    if (sortingDirection === "ASCENDING" || sortingDirection === "UNSORTED") {
      return "DESCENDING";
    } else {
      return "ASCENDING";
    }
  }
  const sortColum = (sortKey) => {
    const newAudioList = [...audios];
    const currentSortingDirection = sortingDirections[sortKey];
    sortData(newAudioList, sortKey, currentSortingDirection);
    const nextSortingDirection = getNextDirection(currentSortingDirection);
    const newSortingDirections = { ...sortingDirections };
    newSortingDirections[sortKey] = nextSortingDirection;
    setAudios(newAudioList);
    setSortingDirections(newSortingDirections);
    setCurrentSortingKey(sortKey);
    setError(null);
  }

  return (
    <div className="wrapper">
      <div className="title"><h2>Deepgram Audio Server</h2></div>
      <div className="action-row">
        <div className="search">
          <label htmlFor="search-input" className="search-input">Search</label>
          <input id="search-input" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </div>
        <div className="upload-file">
          {loading && <div className="loading-spinner"></div>}
          <label htmlFor="file-upload" className="custom-file-upload">Upload a file</label>
          <input id="file-upload" type="file" onChange={handleFileChange} />
        </div>
      </div>
      {error && <div className="error"><FontAwesomeIcon icon={faWarning} />{error}</div>}
      <div className="grid">
        <div className="header-row">
          {Object.keys(sortingDirections).map((key) => {
            const direction = (sortingDirections[key] === "ASCENDING" || sortingDirections[key] === "UNSORTED") ? faArrowDown : faArrowUp;
            return <div className="header-cell" onClick={() => sortColum(key)}>{key}<FontAwesomeIcon icon={direction} /></div>
          })}
          <div className="header-cell"></div>
          <div className="header-cell"></div>
        </div>
        {audios?.length > 0 && getPaginatedData()
          .filter((audio) => audio?.name?.toLowerCase().includes(searchValue.toLowerCase()))
          .map((audio, index) =>
            <div key={index} className={`data-row ${currentFile?.id === audio.id ? "highlight" : ""}`}>
              <div className="data-cell">{audio.name}</div>
              <div className="data-cell">{audio.duration}</div>
              <div className="data-cell">{audio.size}</div>
              <div className="data-cell">
                <div className="active" onClick={() => handleTranscript(audio)}>
                  TRANSCRIBE
                </div>
              </div>
              <div className="data-cell">
                <div className="active" onClick={() => handleFileDownload(audio)}>
                  DOWNLOAD
                </div>
              </div>
            </div>)}
        {audios?.length === 0 && audios.map((audio) => <div className="dataRow">
          <div className="data-cell"></div>
          <div className="data-cell"></div>
          <div className="data-cell"></div>
          <div className="data-cell">TRANSCRIBE</div>
          <div className="data-cell">DOWNLOAD</div>
        </div>)}
      </div>
      <div className="transcript">
        <div className="transcript-name">TRANSCRIPT: {currentFile?.name}</div>
        <div className="transcript-detail">{currentFile?.transcript}</div>
      </div>
      <div className="audio-player">
        <audio controls src={`/assets/${currentFile?.name}`}>
          Your browser does not support the audio element
        </audio>
      </div>
      <div className="pagination-controls">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {Math.ceil(audios.length / itemsPerPage)}</span>
        <button onClick={handleNextPage} disabled={currentPage === Math.ceil(audios.length / itemsPerPage)}>
          Next
        </button>
      </div>

    </div >

  )
}

export default App