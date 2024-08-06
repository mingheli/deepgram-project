import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
const Header = ({ sortColumn, sortingDirections }) => {
    return (
        <div className="header-row">
            {Object.keys(sortingDirections).map((key) => {
                const arrow = (sortingDirections[key] === "ASCENDING" || sortingDirections[key] === "UNSORTED") ?
                    <FontAwesomeIcon icon={faArrowDown} /> : <FontAwesomeIcon icon={faArrowUp} />;
                return <div className="header-cell" onClick={() => sortColumn(key)}>{key}{arrow} </div>
            })}
            <div className="header-cell"></div>
            <div className="header-cell"></div>
        </div>
    );
}
export default Header;