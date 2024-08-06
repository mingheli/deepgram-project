const Audios = ({ audioList, handleTranscribe, currentFile }) => {
    const handleDownload = (file) => {
        const element = document.createElement('a');
        const fileContent = file.transcript;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(blob);
        element.download = `${file.name}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    return (
        <>
            {audioList.length > 0 && audioList.map((file, index) => (
                <div className={`data_row ${currentFile?.id === file?.id ? "selected" : ""}`} key={index}>
                    <div className="data_cell">{file.name}</div>
                    <div className="data_cell">{file.duration}</div>
                    <div className="data_cell">{file.size}MB</div>
                    <div className="data_cell"><div className="transcribe_action active" onClick={() => handleTranscribe(file)}>TRANSCRIBE</div></div>
                    <div className="data_cell"><div className="download_action active" onClick={() => handleDownload(file)}>DOWNLOAD</div></div>
                </div>
            ))}
            {audioList.length === 0 &&
                <div className="data_row">
                    <div className="data_cell"></div>
                    <div className="data_cell"></div>
                    <div className="data_cell"></div>
                    <div className="data_cell"><div className="transcribe_action inactive">TRANSCRIBE</div></div>
                    <div className="data_cell"><div className="download_action inactive">DOWNLOAD</div></div>
                </div>
            }
        </>
    );
}
export default Audios;