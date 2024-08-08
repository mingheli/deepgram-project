const Audios = ({ audioList, handleTranscribe, currentFile, searchKey, getPaginatedData }) => {
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
            {audioList.length > 0 && getPaginatedData()
                .filter((file) => file?.name?.toLowerCase().includes(searchKey?.toLowerCase()))
                .map((file, index) => (
                    <div className={`data-row ${currentFile?.id === file?.id ? "selected" : ""}`} key={index}>
                        <div className="data-cell">{file.name}</div>
                        <div className="data-cell">{file.duration}</div>
                        <div className="data-cell">{file.size}MB</div>
                        <div className="data-cell"><div className="transcribe-action active" onClick={() => handleTranscribe(file)}>TRANSCRIBE</div></div>
                        <div className="data-cell"><div className="download-action active" onClick={() => handleDownload(file)}>DOWNLOAD</div></div>
                    </div>
                ))}
            {audioList.length === 0 &&
                <div className="data-row">
                    <div className="data-cell"></div>
                    <div className="data-cell"></div>
                    <div className="data-cell"></div>
                    <div className="data-cell"><div className="transcribe-action inactive">TRANSCRIBE</div></div>
                    <div className="data-cell"><div className="download-action inactive">DOWNLOAD</div></div>
                </div>
            }
        </>
    );
}
export default Audios;