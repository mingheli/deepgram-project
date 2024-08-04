import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Audios from "./components/Audios";
import { formatDuration } from "./utils/formatterUtils";
import "./App.css";

const flatData = (data, file) => {
  const { metadata, results } = data
  return ({
    name: file.name,
    duration: formatDuration(metadata.duration),
    transcript: results.channels[0].alternatives[0].transcript,
    size: (file.size / (1024 * 1024)).toFixed(2)
  });
}
const sortData = (
  data,
  sortKey,
  sortingDirection
) => {
  data.sort((a, b) => {
    const relevantValueA = a[sortKey];
    const relevantValueB = b[sortKey];

    if (
      sortingDirection === "UNSORTED" ||
      sortingDirection === "ASCENDING"
    ) {
      if (relevantValueA < relevantValueB) return -1;
      if (relevantValueA > relevantValueB) return 1;
      return 0;
    } else {
      if (relevantValueA > relevantValueB) return -1;
      if (relevantValueA < relevantValueB) return 1;
      return 0;
    }
  });
};
const getNextSortingDirection = (sortingDirection) => {
  if (
    sortingDirection === "UNSORTED" ||
    sortingDirection === "ASCENDING"
  ) {
    return "DESCENDING";
  }
  return "ASCENDING";
};

const App = () => {
  const [files, setFiles] = useState([]);
  const [audioList, setAudioList] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentSortingKey, setCurrentSortingKey] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [sortingDirections, setSortingDirections] = useState({
    name: "UNSORTED",
    duration: "UNSORTED",
    size: "UNSORTED",
  });
  const TOKEN = process.env.REACT_APP_API_TOKEN;
  const DEEPGRAM_HOST = process.env.REACT_APP_DEEPGRAM_HOST;

  const sortColumn = (sortKey) => {
    const newAudioList = [...audioList];

    const currentSortingDirection = sortingDirections[sortKey];

    sortData(newAudioList, sortKey, currentSortingDirection);
    const nextSortingDirection = getNextSortingDirection(
      currentSortingDirection
    );

    const newSortingDirections = { ...sortingDirections };
    newSortingDirections[sortKey] = nextSortingDirection;

    setAudioList(newAudioList);
    setSortingDirections(newSortingDirections);
    setCurrentSortingKey(sortKey);
  };

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

  const handleAudioPlay = (audioUrl) => {
    setCurrentAudioUrl(audioUrl);
  };

  return (
    <div className="wrapper">
      <div className="title">
        <h2>Deepgram Audio Server</h2>
      </div>
      <div className="actionrow">
        <div className="search">
          <div>Search</div>
          <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </div>
        <div className="upload">
          {loading && <div className="loading-spinner"></div>}
          <label htmlFor="file-upload" className="custom-file-upload">
            Upload a file
          </label>
          <input id="file-upload" type="file" onChange={handleFileChange} />
        </div>
      </div>
      <div className='grid'>
        <Header onSort={sortColumn} sortingDirections={sortingDirections} currentSortingKey={currentSortingKey} />
        <Audios audioList={audioList} searchKey={searchValue} handleTranscribe={handleTranscribe} handleAudioPlay={handleAudioPlay} />
      </div>
      <div className="transcriptName">Transcript: {currentFile?.name}</div>
      <div className="transcript">{currentFile?.transcript}</div>
      <div className="audio-player">
        <audio controls src={`/assets/${currentFile?.name}`}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};
export default App;
