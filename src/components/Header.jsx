import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
const Header = ({ sortColumn, sortingDirections, currentSortColumn }) => {
    return (
        <div className="header-row">
            {Object.keys(sortingDirections).map((key) => {
                const icn = (sortingDirections[key] === "ASCENDING" || sortingDirections[key] === "UNSORTED") ? <FontAwesomeIcon icon={faArrowDown} /> : <FontAwesomeIcon icon={faArrowUp} />
                return <div className={`header-cell ${currentSortColumn === key ? "active-column" : ""}`} onClick={() => sortColumn(key)}>{key}{icn}</div>
            }
            )}
            <div className="header-cell"></div>
            <div className="header-cell"></div>
        </div>
    );
}
export default Header;