import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
const Header = ({ sortColumn, sortingDirections, selectedColumn }) => {
    return (
        <div className="header-row">
            {Object.keys(sortingDirections).map((key) => {
                const icn = sortingDirections[key] === "descending" ? <FontAwesomeIcon icon={faArrowUp} /> : <FontAwesomeIcon icon={faArrowDown} />
                return <div key={key} className={`header-cell ${selectedColumn === key ? "selectedColumn" : ""}`} onClick={() => sortColumn(key)}>{key}{icn}</div>
            })}
            <div className="header-cell"></div>
            <div className="header-cell"></div>
        </div>
    );
}
export default Header;